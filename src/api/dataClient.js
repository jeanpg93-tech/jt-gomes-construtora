import { requireSupabase } from './supabaseClient';
import { createEntityClient, entityTables } from './entityClient';

const entities = Object.fromEntries(Object.entries(entityTables).map(([name, table]) => [name, createEntityClient(requireSupabase, table)]));
// Anonymous requests go through a narrow RPC; they cannot read applicants or grant themselves access.
entities.SolicitacaoCadastro.create = async payload => {
  const { data, error } = await requireSupabase().rpc('request_access', { payload });
  if (error) throw error;
  return { id: data };
};

export const dataClient = {
  entities,
  auth: {
    async me() {
      const client = requireSupabase();
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError || !user) throw authError || Object.assign(new Error('Entre para continuar.'), { status: 401 });
      const { data, error } = await client.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      return data;
    },
    async updateMe(payload) {
      const { data, error } = await requireSupabase().rpc('update_my_profile', { payload });
      if (error) throw error;
      return data;
    },
    async logout(redirect = true) {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
      if (redirect) window.location.assign('/login');
    },
    redirectToLogin(nextUrl = window.location.href) {
      const target = new URL(nextUrl, window.location.origin);
      const next = target.origin === window.location.origin ? target.pathname + target.search : '/';
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
    },
  },
  integrations: { Core: {
    async UploadFile({ file }) {
      const client = requireSupabase();
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError || !user) throw authError || new Error('Entre para enviar arquivos.');
      const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'bin';
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await client.storage.from('documentos').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data, error: signError } = await client.storage.from('documentos').createSignedUrl(path, 3600);
      if (signError) throw signError;
      // Persist a stable object reference; signed URLs expire and must never be saved in the database.
      return { file_url: `storage://documentos/${path}`, signed_url: data.signedUrl };
    },
  } },
};

export async function resolveFileUrl(value) {
  if (!value?.startsWith('storage://documentos/')) return value;
  const path = value.slice('storage://documentos/'.length);
  const { data, error } = await requireSupabase().storage.from('documentos').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
