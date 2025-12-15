export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          logo: string;
          display_order: number;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          logo: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          logo?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      modules: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          tag: string;
          color: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          tag: string;
          color: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          tag?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      test_data: {
        Row: {
          id: string;
          name: string;
          description: string;
          product_id: string;
          module_id: string;
          category_id: string;
          test_data: string;
          expected: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          product_id: string;
          module_id: string;
          category_id: string;
          test_data: string;
          expected: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          product_id?: string;
          module_id?: string;
          category_id?: string;
          test_data?: string;
          expected?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_modules: {
        Row: {
          id: string;
          product_id: string;
          module_id: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          product_id: string;
          module_id: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          product_id?: string;
          module_id?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
    };
  };
}