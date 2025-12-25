import { Page } from "../types";
import { supabase } from "./supabaseClient";

const TABLE_NAME = 'pages';

const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const PageService = {
    /**
     * Get all pages
     */
    getAllPages: async (): Promise<Page[]> => {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching pages:', error);
                return [];
            }

            return (data as any[]).map(page => ({
                id: page.id,
                title: page.title,
                createdAt: page.created_at,
            }));
        } catch (e) {
            console.error('Failed to load pages:', e);
            return [];
        }
    },

    /**
     * Create a new page
     */
    createPage: async (title: string = 'Untitled Page'): Promise<Page> => {
        try {
            const newPage: Page = {
                id: generateId(),
                title,
                createdAt: Date.now(),
            };

            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([{
                    id: newPage.id,
                    title: newPage.title,
                    created_at: newPage.createdAt
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating page:', error);
                throw error;
            }

            return {
                id: data.id,
                title: data.title,
                createdAt: data.created_at
            };
        } catch (e) {
            console.error('Failed to create page:', e);
            throw e;
        }
    },

    /**
     * Delete a page
     */
    deletePage: async (id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting page:', error);
                throw error;
            }
        } catch (e) {
            console.error('Failed to delete page:', e);
            throw e;
        }
    },

    /**
     * Update page title
     */
    updatePage: async (id: string, title: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from(TABLE_NAME)
                .update({ title })
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            console.error("Failed to update page", e);
            throw e;
        }
    }
};
