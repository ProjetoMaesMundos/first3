export interface RegistroItem {
  id: string;
  tipo: 'som' | 'marco' | 'check-in' | 'anotacao';
  titulo: string;
  descricao?: string;
  data: string;
}

const STORAGE_KEY = 'first3_registros_v1';

export function getRegistros(): RegistroItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRegistro(item: Omit<RegistroItem, 'id' | 'data'>): RegistroItem {
  const registros = getRegistros();
  const novo: RegistroItem = {
    ...item,
    id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    data: new Date().toISOString()
  };
  registros.unshift(novo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  return novo;
}

export function deleteRegistro(id: string): void {
  const registros = getRegistros().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}
