import { create } from 'zustand';

// Export the types for faker categories and types
export type FakerCategory = 'address' | 'commerce' | 'company' | 'database' | 'date' | 
  'finance' | 'hacker' | 'image' | 'internet' | 'lorem' | 'name' | 'phone' | 'random' | 'system' | 'vehicle' | '';

// Instead of column types, we're using faker types
export interface Column {
  id: string;
  name: string;
  useFaker: boolean;
  fakerCategory: FakerCategory;
  fakerType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  position: { x: number; y: number };
}

export interface Relationship {
  id: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  // Properties for enhanced relationships
  sourceHandleId?: string;
  targetHandleId?: string;
  sourceCardinality?: 'one' | 'many';
  targetCardinality?: 'one' | 'many';
  type: 'one-to-many' | 'one-to-one' | 'many-to-many' | 'many-to-one';
}

interface DiagramState {
  tables: Table[];
  relationships: Relationship[];
  addTable: (name: string, position: { x: number; y: number }, id?: string) => void;
  removeTable: (tableId: string) => void;
  addColumn: (tableId: string, name: string, fakerCategory: FakerCategory, fakerType: string) => void;
  updateColumn: (tableId: string, columnId: string, updates: Partial<Column>) => void;
  removeColumn: (tableId: string, columnId: string) => void;
  addRelationship: (relationship: Omit<Relationship, 'id'> & { id?: string }) => void;
  removeRelationship: (relationshipId: string) => void;
  updateTablePosition: (tableId: string, position: { x: number; y: number }) => void;
  updateTableName: (tableId: string, newName: string) => void;
  updateRelationship: (relationshipId: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (relationshipId: string) => void;
}

// Helper function to generate UUIDs
const generateUUID = () => {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
};

export const useStore = create<DiagramState>((set, get) => ({
  tables: [],
  relationships: [],

  addTable: (name, position, id) => {
    if (!name.trim()) {
      console.error('Table name cannot be empty.');
      return;
    }

    const existingTable = get().tables.find((table) => table.name.toLowerCase() === name.trim().toLowerCase());
    if (existingTable) {
      alert('Table with this name already exists.');
      return;
    }

    set((state) => ({
      tables: [
        ...state.tables,
        {
          id: id || generateUUID(),
          name,
          columns: [
            {
              id: generateUUID(),
              name: 'id',
              useFaker: true,
              fakerCategory: 'database',
              fakerType: 'mongodbObjectId',
              isPrimaryKey: true,
              isForeignKey: false,
              isNullable: false,
              isUnique: true,
            },
          ],
          position,
        },
      ],
    }));
  },

  removeTable: (tableId) => {
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== tableId),
      relationships: state.relationships.filter(
        (rel) => rel.sourceTableId !== tableId && rel.targetTableId !== tableId
      ),
    }));
  },

  addColumn: (tableId, name, fakerCategory, fakerType) => {
    if (!name.trim()) {
      console.error('Column name cannot be empty.');
      return;
    }

    set((state) => ({
      tables: state.tables.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            columns: [
              ...table.columns,
              {
                id: generateUUID(),
                name,
                useFaker: true,
                fakerCategory,
                fakerType,
                isPrimaryKey: false,
                isForeignKey: false,
                isNullable: true,
                isUnique: false,
              },
            ],
          };
        }
        return table;
      }),
    }));
  },

  updateTableName: (tableId, newName) => {
    if (!newName.trim()) {
      console.error('Table name cannot be empty.');
      return;
    }

    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId
          ? { ...table, name: newName.trim() }
          : table
      ),
    }));
  },

  updateColumn: (tableId, columnId, updates) => {
    set((state) => ({
      tables: state.tables.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            columns: table.columns.map((column) =>
              column.id === columnId ? { ...column, ...updates } : column
            ),
          };
        }
        return table;
      }),
    }));
  },

  removeColumn: (tableId, columnId) => {
    set((state) => ({
      tables: state.tables.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            columns: table.columns.filter((column) => column.id !== columnId),
          };
        }
        return table;
      }),
      relationships: state.relationships.filter(
        (rel) =>
          !(
            (rel.sourceTableId === tableId && rel.sourceColumnId === columnId) ||
            (rel.targetTableId === tableId && rel.targetColumnId === columnId)
          )
      ),
    }));
  },

  addRelationship: (relationship) => {
    set((state) => ({
      relationships: [
        ...state.relationships,
        {
          id: relationship.id || generateUUID(),
          sourceTableId: relationship.sourceTableId,
          sourceColumnId: relationship.sourceColumnId,
          targetTableId: relationship.targetTableId,
          targetColumnId: relationship.targetColumnId,
          sourceHandleId: relationship.sourceHandleId,
          targetHandleId: relationship.targetHandleId,
          sourceCardinality: relationship.sourceCardinality,
          targetCardinality: relationship.targetCardinality,
          type: relationship.type,
        },
      ],
    }));
  },

  removeRelationship: (relationshipId) => {
    set((state) => ({
      relationships: state.relationships.filter((rel) => rel.id !== relationshipId),
    }));
  },

  updateTablePosition: (tableId, position) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId ? { ...table, position } : table
      ),
    }));
  },

  updateRelationship: (relationshipId, updates) => {
    set((state) => ({
      relationships: state.relationships.map((rel) =>
        rel.id === relationshipId ? { ...rel, ...updates } : rel
      ),
    }));
  },

  deleteRelationship: (relationshipId) => {
    set((state) => ({
      relationships: state.relationships.filter((rel) => rel.id !== relationshipId),
    }));
  },
}));