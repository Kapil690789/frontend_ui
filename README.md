# FlockAI Frontend UI

A highly extensible, configuration-driven React interface for triggering and managing background workflows via Temporal.

## Application Architecture & Data Flow

The frontend acts as a thin client to submit workflow parameters to the FastAPI backend. The FastAPI backend serves as the Temporal Client, which schedules and manages background tasks executed by Python workers.

Below is a detailed sequence diagram illustrating the complete lifecycle of a workflow execution, including user interactions, error handling, system boundaries, and planned features.

## Setup & Local Development

### Prerequisites
- Node.js (v18+)
- Local backend running on `localhost:8000`

### Installation
```bash
cd frontend_ui
npm install
npm run dev
```

## Adding New Tools

The UI is entirely dynamically generated based on the configuration in `src/tools.js`. 
To add a new workflow tool to the UI:

1. Open `src/tools.js`.
2. Append a new object to the `TOOLS` array.
3. Define the `id`, `name`, `description`, `category`, and `fields` array.
4. Implement the `buildPayload(fields)` function, which maps the UI states into the exact parameterized JSON expected by the `/workflows/run` API endpoint.

### Example Tool Definition
```javascript
{
  id: 'my_new_tool',
  name: 'Brand New Tool',
  description: 'Does something awesome in the background using Temporal.',
  category: 'Utilities',
  fields: [
    { key: 'sheet_url', label: 'Google Sheet URL', type: 'url', required: true },
    { key: 'overwrite', label: 'Overwrite Data', type: 'boolean', defaultValue: false }
  ],
  buildPayload: (fields) => ({
    tenant_id: 'my_new_tool',
    file_uri: fields.sheet_url,
    tenant_config: {
      global_steps: [{ 
        activity: 'do_any_thing',
        inputs: {
           url: '${input.file_uri}',
           overwrite: fields.overwrite
        }
      }]
    }
  })
}
```


