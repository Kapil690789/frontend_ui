// All available workflow tools and their configuration
export const API_URL = 'http://localhost:8000/workflows/run';

// ── Brand presets for Scene7 Downloader ──────────────────────────────────────
export const BRAND_PRESETS = {
  kate_spade: {
    label: 'Kate Spade',
    base_url_template: 'https://katespade.scene7.com/is/image/KateSpade/{}?scl=1',
    code_transform: 'upper',
    column_name: 'Bag code',
    status_column: 'Status',
  },
  coach: {
    label: 'Coach',
    base_url_template: 'https://coach.scene7.com/is/image/Coach/{}_a0?scl=1',
    code_transform: 'lower',
    column_name: 'Bag_code',
    status_column: 'Upload_Status',
  },
};

// ── Tool definitions ─────────────────────────────────────────────────────────
export const TOOLS = [
  // ── 1. Scene7 Image Downloader ──────────────────────────────────────
  {
    id: 'scene7_downloader',
    name: 'Scene7 Image Downloader',
    description: 'Download product images from Scene7 CDN using codes from a Google Sheet and upload them to Drive.',
    category: 'Images',
    fields: [
      {
        key: '_brand_preset',
        label: 'Brand Preset',
        type: 'brand_select',
        help: 'Selecting a brand auto-fills the URL template, column names and transform settings.',
      },
      { key: 'file_uri', label: 'Google Sheet URL', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 'column_name', label: 'Image Code Column', type: 'text', placeholder: 'Bag code', required: true, defaultValue: 'Bag code' },
      { key: 'drive_folder_id', label: 'Destination Drive Folder ID', type: 'text', placeholder: '1NjyIOB4f...', required: true },
      { key: 'base_url_template', label: 'Scene7 Base URL Template', type: 'text', placeholder: 'https://katespade.scene7.com/is/image/KateSpade/{}?scl=1', required: true, defaultValue: '' },
      {
        key: 'code_transform', label: 'Code Transform', type: 'select',
        options: [{ value: 'none', label: 'None (keep as-is)' }, { value: 'upper', label: 'UPPER CASE' }, { value: 'lower', label: 'lower case' }],
        defaultValue: 'upper',
        help: 'Kate Spade -> UPPER, Coach -> lower',
      },
      { key: 'status_column', label: 'Status Column Name', type: 'text', placeholder: 'Status', defaultValue: 'Status' },
      { key: 'check_url_exists', label: 'Pre-flight URL Check', type: 'boolean', defaultValue: true, help: 'Send a HEAD request before downloading to skip broken/missing images.' },
      { key: 'overwrite', label: 'Overwrite Existing Files', type: 'boolean', defaultValue: false },
      { key: 'max_workers', label: 'Parallel Workers', type: 'number', defaultValue: 4 },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'scene7_downloader',
      tenant_name: 'Scene7 Downloader',
      file_uri: fields.file_uri,
      tenant_config: {
        require_validation_approval: false,
        steps: [],
        global_steps: [{
          activity: 'download_and_upload_scene7_images',
          id: 'download_scene7',
          inputs: {
            file_uri: '${input.file_uri}',
            column_name: fields.column_name,
            base_url_template: fields.base_url_template,
            drive_folder_id: fields.drive_folder_id,
            overwrite: bool(fields.overwrite),
            code_transform: fields.code_transform === 'none' ? null : fields.code_transform,
            status_column: fields.status_column || 'Status',
            check_url_exists: bool(fields.check_url_exists),
            max_workers: Number(fields.max_workers) || 4,
          },
        }],
      },
    }),
  },

  // ── 2. PDF Generator ─────────────────────────────────────────────────
  {
    id: 'pdf_generator',
    name: 'PDF Generator',
    description: 'Generate printable PDF catalogs from image links in a Google Sheet and upload to S3.',
    category: 'PDF',
    fields: [
      { key: 'file_uri', label: 'Google Sheet URL', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 's3_bucket', label: 'S3 Bucket', type: 'text', placeholder: 'flock-generation-automation', defaultValue: 'flock-generation-automation', required: true },
      { key: 's3_prefix', label: 'S3 Output Prefix', type: 'text', placeholder: 'pdf_test', defaultValue: 'pdf_test', required: true },
      { key: 'images_per_row', label: 'Images Per Row', type: 'number', defaultValue: 3 },
      { key: 'rows_per_pdf', label: 'Rows Per PDF', type: 'number', defaultValue: 25 },
      { key: 'max_workers', label: 'Parallel Workers', type: 'number', defaultValue: 10 },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'pdf_gen',
      tenant_name: 'PDF Generator',
      file_uri: fields.file_uri,
      tenant_config: {
        require_validation_approval: false,
        images_per_row: Number(fields.images_per_row),
        rows_per_pdf: Number(fields.rows_per_pdf),
        s3_bucket: fields.s3_bucket,
        s3_prefix: fields.s3_prefix,
        steps: [{
          activity: 'generate_pdf_from_sheet',
          id: 'generate_pdf',
          inputs: {
            images_per_row: '${config.images_per_row}',
            rows_per_pdf: '${config.rows_per_pdf}',
            rows: '${rows}',
            s3_bucket: '${config.s3_bucket}',
            s3_prefix: '${config.s3_prefix}',
            max_workers: Number(fields.max_workers),
          },
        }],
      },
    }),
  },

  // ── 3. Drive Folder Sync ──────────────────────────────────────────────
  {
    id: 'drive_folder_sync',
    name: 'Drive Folder Sync',
    description: 'Scan a Drive folder for subfolders, match them to SKU IDs in a sheet, and write folder links back.',
    category: 'Drive',
    fields: [
      { key: 'file_uri', label: 'Google Sheet URL', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 'drive_folder_id', label: 'Drive Folder ID to Scan', type: 'text', placeholder: '1kQO7uq3cW8...', required: true },
      { key: 'sku_column', label: 'SKU Column Name', type: 'text', placeholder: 'Sku_id', defaultValue: 'Sku_id', required: true },
      { key: 'target_column', label: 'Target Column (for links)', type: 'text', placeholder: 'Edit folder links', defaultValue: 'Edit folder links', required: true },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'drive_folder_sync',
      tenant_name: 'Drive Folder Sync',
      file_uri: fields.file_uri,
      tenant_config: {
        require_validation_approval: false,
        steps: [],
        global_steps: [{
          activity: 'sync_drive_folders_to_sheet',
          id: 'sync_drive_folders',
          inputs: {
            file_uri: '${input.file_uri}',
            drive_folder_id: fields.drive_folder_id,
            sku_column: fields.sku_column,
            target_column: fields.target_column,
          },
        }],
      },
    }),
  },

  // ── 4. SKU Image Organizer ────────────────────────────────────────────
  {
    id: 'sku_organizer',
    name: 'SKU Image Organizer',
    description: 'Find images in a source Drive folder by SKU prefix, copy them to per-SKU subfolders in the destination, and update the sheet.',
    category: 'Drive',
    fields: [
      { key: 'file_uri', label: 'Google Sheet URL', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 'source_folder_id', label: 'Source Drive Folder ID', type: 'text', placeholder: '1d_0_5vL5iO8...', required: true },
      { key: 'destination_folder_id', label: 'Destination Drive Folder ID', type: 'text', placeholder: '1d_0_5vL5iO8...', required: true },
      { key: 'sku_column', label: 'SKU Column Name', type: 'text', placeholder: 'Sku_id', defaultValue: 'Sku_id', required: true },
      { key: 'output_column', label: 'Output Column (for links)', type: 'text', placeholder: 'Image Download URL', defaultValue: 'Image Download URL' },
      { key: 'overwrite', label: 'Overwrite Existing', type: 'boolean', defaultValue: false },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'sku_organizer',
      tenant_name: 'SKU Image Organizer',
      file_uri: fields.file_uri,
      tenant_config: {
        require_validation_approval: false,
        steps: [],
        global_steps: [{
          activity: 'organize_and_copy_sku_images',
          id: 'organize_sku_images',
          inputs: {
            file_uri: '${input.file_uri}',
            source_folder_id: fields.source_folder_id,
            destination_folder_id: fields.destination_folder_id,
            sku_column: fields.sku_column,
            output_column: fields.output_column,
            overwrite: bool(fields.overwrite),
          },
        }],
      },
    }),
  },

  // ── 5. SKU Folder Creator ──────────────────────────────────────────────
  {
    id: 'sku_folder_creator',
    name: 'SKU Folder Creator',
    description: 'Create Drive folders per SKU, download product and source images into subfolders, and write folder links back to the sheet.',
    category: 'Drive',
    fields: [
      { key: 'file_uri', label: 'Google Sheet URL', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 'output_folder_id', label: 'Output Drive Folder ID', type: 'text', placeholder: '1jEUBAFpMvhz...', required: true },
      { key: 'sku_column', label: 'SKU Column Name', type: 'text', placeholder: 'Sku_id', defaultValue: 'Sku_id', required: true },
      { key: 'folder_link_column', label: 'Folder Link Column', type: 'text', placeholder: 'Edit folder links', defaultValue: 'Edit folder links' },
      { key: 'product_image_column', label: 'Product Image Column', type: 'text', placeholder: 'Product image', defaultValue: 'Product image' },
      { key: 'source_image_column', label: 'Source Image Column', type: 'text', placeholder: 'Source image', defaultValue: 'Source image' },
      { key: 'overwrite', label: 'Overwrite Existing', type: 'boolean', defaultValue: false },
      { key: 'timeout_minutes', label: 'Timeout (minutes)', type: 'number', defaultValue: 60 },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'sku_folder_creator',
      tenant_name: 'SKU Folder Creator',
      file_uri: fields.file_uri,
      tenant_config: {
        require_validation_approval: false,
        steps: [],
        global_steps: [{
          activity: 'organize_sku_folders_in_drive',
          id: 'organize_sku_folders',
          timeout_minutes: Number(fields.timeout_minutes),
          inputs: {
            file_uri: '${input.file_uri}',
            output_folder_id: fields.output_folder_id,
            sku_column: fields.sku_column,
            folder_link_column: fields.folder_link_column,
            overwrite: bool(fields.overwrite),
            image_columns: [
              { column: fields.product_image_column, subfolder: 'Product Image' },
              { column: fields.source_image_column, subfolder: 'Source Image' },
            ],
          },
        }],
      },
    }),
  },

  // ── 6. Image Links to Sheet ────────────────────────────────────────────
  {
    id: 'image_links_to_sheet',
    name: 'Image Links to Sheet',
    description: 'Recursively scan a Drive folder for images and populate their links into a Google Sheet tab.',
    category: 'Drive',
    fields: [
      { key: 'file_uri', label: 'Google Sheet URL', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 'drive_folder_id', label: 'Drive Folder ID to Scan', type: 'text', placeholder: '1dm9Ga3KEGwl...', required: true },
      { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text', placeholder: '1f6mHt411jTh...', required: true },
      { key: 'sheet_name', label: 'Sheet Tab Name', type: 'text', placeholder: 'Sheet1', defaultValue: 'Sheet1', required: true },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'image_links_sync',
      tenant_name: 'Image Links to Sheet',
      file_uri: fields.file_uri,
      tenant_config: {
        require_validation_approval: false,
        steps: [],
        global_steps: [{
          activity: 'sync_drive_image_links_to_sheet',
          id: 'sync_image_links',
          inputs: {
            drive_folder_id: fields.drive_folder_id,
            spreadsheet_id: fields.spreadsheet_id,
            sheet_name: fields.sheet_name,
          },
        }],
      },
    }),
  },

  // ── 7. Random Images Organizer ─────────────────────────────────────────
  {
    id: 'random_images_organizer',
    name: 'Random Images Organizer',
    description: 'Group images by SKU from multiple sheet columns, push them to Drive subfolders, and update the output column.',
    category: 'Images',
    fields: [
      { key: 'file_uri', label: 'Google Sheet URL', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 'drive_parent_folder_id', label: 'Drive Parent Folder ID', type: 'text', placeholder: '1-qeJt8VbYB6...', required: true },
      { key: 'sku_column', label: 'SKU Column Name', type: 'text', placeholder: 'SKU Name', defaultValue: 'SKU Name', required: true },
      { key: 'output_column', label: 'Output Column Letter', type: 'text', placeholder: 'L', defaultValue: 'L' },
      { key: 'product_image_col', label: 'Product Image Column', type: 'text', placeholder: 'Product image', defaultValue: 'Product image' },
      { key: 'product_image_col2', label: 'Product Image Column 2', type: 'text', placeholder: 'Product image1', defaultValue: 'Product image1' },
      { key: 'pairing_image_col', label: 'Pairing Image Column', type: 'text', placeholder: 'BOTTOM / TOP', defaultValue: 'BOTTOM / TOP' },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'copy_random_images',
      tenant_name: 'Random Images Organizer',
      file_uri: fields.file_uri,
      tenant_config: {
        drive_parent_folder_id: fields.drive_parent_folder_id,
        sku_column: fields.sku_column,
        output_column: fields.output_column,
        require_validation_approval: false,
        steps: [
          {
            activity: 'organize_sku_images_in_drive',
            id: 'organize_sku',
            inputs: {
              drive_parent_folder_id: '${config.drive_parent_folder_id}',
              sku_name: '${row.' + fields.sku_column + '}',
              product_image_links: [
                '${row.' + fields.product_image_col + '}',
                '${row.' + fields.product_image_col2 + '}',
              ],
              pairing_image_link: '${row.' + fields.pairing_image_col + '}',
            },
          },
          {
            activity: 'update_cell',
            id: 'update_sheet',
            inputs: {
              spreadsheet_id: '${spreadsheet_id}',
              sheet_name: '${resolved_sheet_name}',
              range: '${config.output_column}${row_number}',
              values: [['${organize_sku}']],
            },
          },
        ],
      },
    }),
  },

  // 8. Drive Image Links for SKU
  {
    id: 'sku_image_links',
    name: 'SKU Drive Image Links',
    description: 'Look up image files in a Drive folder by SKU prefix and return their links (first image, all comma-separated, or newline-separated).',
    category: 'Drive',
    fields: [
      { key: 'file_uri', label: 'Google Sheet URL (for context)', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 'parent_folder_id', label: 'Drive Parent Folder ID', type: 'text', placeholder: '1d_0_5vL5iO8...', required: true },
      { key: 'sku_id', label: 'SKU ID to Search', type: 'text', placeholder: 'SKU-001', required: true },
      {
        key: 'return_format', label: 'Return Format', type: 'select',
        options: [
          { value: 'first_image', label: 'First image only' },
          { value: 'all_images_comma', label: 'All images (comma-separated)' },
          { value: 'all_images_newline', label: 'All images (newline-separated)' },
        ],
        defaultValue: 'first_image',
      },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'sku_image_links',
      tenant_name: 'SKU Drive Image Links',
      file_uri: fields.file_uri,
      tenant_config: {
        require_validation_approval: false,
        steps: [],
        global_steps: [{
          activity: 'get_drive_image_links_for_sku',
          id: 'get_sku_links',
          inputs: {
            parent_folder_id: fields.parent_folder_id,
            sku_id: fields.sku_id,
            return_format: fields.return_format,
          },
        }],
      },
    }),
  },

  // 9. Nested Image Matcher
  {
    id: 'drive_image_matcher_nested',
    name: 'Nested Image Matcher',
    description: 'Reads SKU and Item Description from a Google Sheet, searches a nested 3-level Drive organization (Root → Category → Style), links images by color code, and updates the sheet.',
    category: 'Drive',
    fields: [
      { key: 'file_uri', label: 'Google Sheet URL', type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/...', required: true },
      { key: 'drive_folder_id', label: 'Root Drive Folder ID', type: 'text', placeholder: '1kQO7uq3cW8...', required: true },
      { key: 'sku_column', label: 'SKU Column Name', type: 'text', placeholder: 'SKU ID - TOP', defaultValue: 'SKU ID - TOP', required: true },
      { key: 'description_column', label: 'Item Description Column', type: 'text', placeholder: 'ITEM DESCRIPTION - TOP', defaultValue: 'ITEM DESCRIPTION - TOP', required: true },
      { key: 'output_column', label: 'Output Column', type: 'text', placeholder: 'Image Download URL', defaultValue: 'Image Download URL', required: true },
      { key: 'overwrite', label: 'Overwrite Existing Links', type: 'boolean', defaultValue: true },
    ],
    buildPayload: (fields) => ({
      tenant_id: 'nested_image_matcher',
      tenant_name: 'Nested Image Matcher',
      file_uri: fields.file_uri,
      tenant_config: {
        require_validation_approval: false,
        steps: [],
        global_steps: [{
          activity: 'sync_nested_style_folder_images',
          id: 'match_nested_images',
          inputs: {
            file_uri: '${input.file_uri}',
            drive_folder_id: fields.drive_folder_id,
            sku_column: fields.sku_column,
            description_column: fields.description_column,
            output_column: fields.output_column,
            overwrite: bool(fields.overwrite),
          },
        }],
      },
    }),
  },

  // 10. Interactive Bag Annotation
  {
    id: 'interactive_bag_annotation',
    name: 'Interactive Bag Annotation',
    description: 'Downloads images from a Drive folder, opens an interactive popup UI for human annotation (clicking points on straps), and saves the resulting CSV back to the same Drive folder.',
    category: 'Annotation',
    fields: [
      { key: 'drive_folder_id', label: 'Drive Folder ID (Source Images)', type: 'text', placeholder: '1kQO7...', required: true },
      { key: 'batch_size', label: 'Batch Size', type: 'text', placeholder: '100', defaultValue: '100', required: true }
    ],
    buildPayload: (fields) => {
      // Create a unique temporary directory name for this run to avoid collisions
      const tempDir = `/tmp/bag_annotation_${Date.now()}`;
      const outputCsv = `${tempDir}/straps_points_data_master.csv`;
      
      return {
        tenant_id: 'bag_annotation',
        tenant_name: 'Interactive Bag Annotation',
        file_uri: 'https://docs.google.com/spreadsheets/d/dummy', // GenericWorkflow validation requires a URL, even if unused by activities
        tenant_config: {
          require_validation_approval: false,
          steps: [],
          global_steps: [
            {
              activity: 'download_drive_folder_files',
              id: 'download_images',
              inputs: {
                folder_id: fields.drive_folder_id,
                destination_folder: tempDir
              }
            },
            {
              activity: 'run_local_annotation_ui',
              id: 'run_ui',
              timeout_minutes: 1440, // 24 hours to allow human interaction
              inputs: {
                input_directory: tempDir,
                output_csv: outputCsv,
                batch_size: parseInt(fields.batch_size) || 100
              }
            },
            {
              activity: 'upload_to_s3',
              id: 'upload_csv_s3',
              inputs: {
                local_file_paths: [outputCsv],
                bucket_name: 'flock-generation-automation',
                s3_key_prefix_main: `bag_annotations/csvs_${Date.now()}`
              }
            },
            {
              activity: 'upload_drive_files',
              id: 'upload_csv_drive',
              inputs: {
                local_paths: [outputCsv],
                parent_id: fields.drive_folder_id
              }
            }
          ]
        }
      };
    }
  }
];

// ── Utility ───────────────────────────────────────────────────────────────────
function bool(val) {
  return val === true || val === 'true';
}
