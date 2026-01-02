
import { WordPressClient } from './wordpress-client.js';
import { config } from './config.js';

async function main() {
  console.log('Inspecting GraphQL Schema...');
  const client = new WordPressClient(config.wordpress);

  const query = `
    query checkFields {
      __type(name: "CreatePostInput") {
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.runGraphQL(query);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error inspecting schema:', error);
  }
}

main();
