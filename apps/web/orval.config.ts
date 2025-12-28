import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: 'http://localhost:3001/api/openapi.json',
    },
    output: {
      target: './src/api/generated.ts',
      client: 'react-query',
      mode: 'tags',
      override: {
        mutator: {
          path: './src/api/mutator/custom-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: false,
          useMutation: true,
        },
      },
    },
  },
});
