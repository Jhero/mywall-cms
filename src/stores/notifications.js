import { writable } from 'svelte/store';

const createNotificationStore = () => {
    const { subscribe, update } = writable([]);

    return {
        subscribe,
        
        add: (notification) => {
            const id = Date.now();
            const newNotification = {
                id,
                type: 'info',
                duration: 5000,
                ...notification
            };
            
            update(notifications => [...notifications, newNotification]);
            
            // Auto remove after duration
            setTimeout(() => {
                update(notifications => 
                    notifications.filter(n => n.id !== id)
                );
            }, newNotification.duration);
            
            return id;
        },
        
        remove: (id) => {
            update(notifications => 
                notifications.filter(n => n.id !== id)
            );
        },
        
        success: (message) => {
            return notificationStore.add({ 
                type: 'success', 
                message,
                duration: 3000
            });
        },
        
        error: (message) => {
            return notificationStore.add({ 
                type: 'error', 
                message,
                duration: 5000
            });
        },
        
        warning: (message) => {
            return notificationStore.add({ 
                type: 'warning', 
                message,
                duration: 4000
            });
        },
        
        info: (message) => {
            return notificationStore.add({ 
                type: 'info', 
                message,
                duration: 3000
            });
        }
    };
};

export const notificationStore = createNotificationStore();
