import { writable } from 'svelte/store';

const createArticleStore = () => {
    const { subscribe, set, update } = writable({
        articles: [],
        loading: false,
        currentArticle: null,
        totalCount: 0,
        currentPage: 1,
        perPage: 10
    });

    return {
        subscribe,
        
        fetchArticles: async (page = 1, search = '') => {
            update(state => ({ ...state, loading: true }));
            
            try {
                const response = await fetch(`/api/articles?page=${page}&search=${search}`);
                const data = await response.json();
                
                update(state => ({
                    ...state,
                    articles: data.articles,
                    totalCount: data.totalCount,
                    currentPage: page,
                    loading: false
                }));
            } catch (error) {
                update(state => ({ ...state, loading: false }));
                console.error('Error fetching articles:', error);
            }
        },
        
        createArticle: async (articleData) => {
            try {
                const response = await fetch('/api/articles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(articleData)
                });
                
                if (response.ok) {
                    const newArticle = await response.json();
                    update(state => ({
                        ...state,
                        articles: [newArticle, ...state.articles]
                    }));
                    return { success: true };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        updateArticle: async (id, articleData) => {
            try {
                const response = await fetch(`/api/articles/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(articleData)
                });
                
                if (response.ok) {
                    const updatedArticle = await response.json();
                    update(state => ({
                        ...state,
                        articles: state.articles.map(article => 
                            article.id === id ? updatedArticle : article
                        )
                    }));
                    return { success: true };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        deleteArticle: async (id) => {
            try {
                const response = await fetch(`/api/articles/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    update(state => ({
                        ...state,
                        articles: state.articles.filter(article => article.id !== id)
                    }));
                    return { success: true };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
    };
};

export const articleStore = createArticleStore();
