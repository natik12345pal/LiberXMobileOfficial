'use client';

export interface SavedTemplate {
  id: string;
  name: string;
  type: 'writer' | 'calc' | 'impress';
  data: string; // JSON stringified content
  createdAt: string;
}

const TEMPLATES_KEY = 'liberxoffice-templates';

export function loadTemplates(): SavedTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTemplate(template: Omit<SavedTemplate, 'id' | 'createdAt'>): SavedTemplate {
  const templates = loadTemplates();
  const newTemplate: SavedTemplate = {
    ...template,
    id: `tpl-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return newTemplate;
}

export function deleteTemplate(id: string) {
  const templates = loadTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function getTemplatesByType(type: 'writer' | 'calc' | 'impress'): SavedTemplate[] {
  return loadTemplates().filter(t => t.type === type);
}
