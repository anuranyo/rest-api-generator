import { create } from 'zustand';

// Export the types so they can be imported in other files
export type ColumnType = 'string' | 'integer' | 'boolean' | 'float' | 'date';

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
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
  type: 'one-to-many' | 'one-to-one' | 'many-to-many';
}

interface DiagramState {
  tables: Table[];
  relationships: {
    id: string;
    sourceTableId: string;
    sourceColumnId: string;
    targetTableId: string;
    targetColumnId: string;
  }[];
  addTable: (name: string, position: { x: number; y: number }) => void;
  removeTable: (tableId: string) => void;
  addColumn: (tableId: string, name: string, type: ColumnType) => void;
  updateColumn: (tableId: string, columnId: string, updates: Partial<Column>) => void;
  removeColumn: (tableId: string, columnId: string) => void;
  addRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  removeRelationship: (relationshipId: string) => void;
  updateTablePosition: (tableId: string, position: { x: number; y: number }) => void;
  updateTableName: (tableId: string, newName: string) => void;
}

// Helper function to generate UUIDs
const generateUUID = () => {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
};

export const useStore = create<DiagramState>((set) => ({
  tables: [],
  relationships: [],

  addTable: (name, position, id?: string) => {
    if (!name.trim()) {
      console.error('Table name cannot be empty.');
      return;
    }

    set((state) => ({
      tables: [
        ...state.tables,
        {
          id: id || generateUUID(), // Use provided ID or generate a new one
          name,
          columns: [
            {
              id: generateUUID(),
              name: 'id',
              type: 'integer',
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

  addColumn: (tableId, name, type) => {
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
                type,
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

  addRelationship: (relationship: Omit<Relationship, 'id'>) => {
    set((state) => ({
      relationships: [
        ...state.relationships, 
        { 
          ...relationship, 
          id: generateUUID() 
        }
      ]
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
}));