alter table medicamentos
  add column if not exists controlado boolean not null default false,
  add column if not exists requer_refrigeracao boolean not null default false;
