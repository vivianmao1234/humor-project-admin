// Config for the tables managed with the generic editor (/manage/[resource]).
// Server actions only accept tables and columns listed here.

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select';

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  lowercase?: boolean;
  defaultValue?: string | number;   // used when the field is left blank (for NOT NULL columns)
  // For selects: rows of `table` become options (value = id, label = labelColumn).
  options?: { table: string; labelColumn: string; allowNone?: string };
};

export type Resource = {
  table: string;
  title: string;
  description: string;
  fields: Field[];
  orderBy: { column: string; ascending: boolean };
};

export const RESOURCES: Record<string, Resource> = {
  terms: {
    table: 'terms',
    title: 'Terms',
    description: 'Campus lore injected into prompts as {{terms}}. Higher priority terms are included first.',
    orderBy: { column: 'priority', ascending: false },
    fields: [
      { name: 'term', label: 'Term', type: 'text', required: true, placeholder: 'e.g. Butler' },
      { name: 'definition', label: 'Definition', type: 'textarea', required: true },
      { name: 'priority', label: 'Priority', type: 'number', defaultValue: 0, placeholder: '0' },
    ],
  },
  examples: {
    table: 'caption_examples',
    title: 'AI generation examples',
    description: 'Example captions injected into prompts as {{examples}}. Leave the flavor empty to use an example for every flavor.',
    orderBy: { column: 'id', ascending: false },
    fields: [
      { name: 'humor_flavor_id', label: 'Flavor', type: 'select', options: { table: 'humor_flavors', labelColumn: 'slug', allowNone: 'All flavors' } },
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'caption', label: 'Caption', type: 'textarea', required: true },
    ],
  },
  models: {
    table: 'llm_models',
    title: 'LLM models',
    description: 'Models the pipeline can call. Inactive models are skipped, including as fallbacks.',
    orderBy: { column: 'id', ascending: true },
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'api_model_id', label: 'API model ID', type: 'text', required: true, placeholder: 'e.g. gemini-3.8-flash' },
      { name: 'llm_provider_id', label: 'Provider', type: 'select', required: true, options: { table: 'llm_providers', labelColumn: 'name' } },
      { name: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },
  providers: {
    table: 'llm_providers',
    title: 'LLM providers',
    description: 'Companies whose models the pipeline can use.',
    orderBy: { column: 'id', ascending: true },
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true, lowercase: true },
      { name: 'base_url', label: 'API base URL', type: 'text' },
    ],
  },
  'signup-domains': {
    table: 'allowed_signup_domains',
    title: 'Allowed signup domains',
    description: 'Anyone with an email on these domains can sign in to the rating app.',
    orderBy: { column: 'domain', ascending: true },
    fields: [{ name: 'domain', label: 'Domain', type: 'text', required: true, lowercase: true, placeholder: 'e.g. columbia.edu' }],
  },
  'whitelisted-emails': {
    table: 'whitelisted_email_addresses',
    title: 'Whitelisted emails',
    description: 'Individual emails allowed to sign in even if their domain isn’t on the list.',
    orderBy: { column: 'email', ascending: true },
    fields: [
      { name: 'email', label: 'Email', type: 'text', required: true, lowercase: true },
      { name: 'note', label: 'Note', type: 'text' },
    ],
  },
};
