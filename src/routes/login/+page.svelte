<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '../../stores/auth.js';
    import '../../styles/global.css'; // ⬅ import global CSS
    import { PUBLIC_API_BASE_URL } from '$env/static/public';

    let email = '';
    let password = '';
    let isLoading = false;
    let error = '';
    let isAuthenticated = false;

    onMount(() => {
        const unsubscribe = authStore.subscribe(auth => {
            isAuthenticated = auth.isAuthenticated;
            if (isAuthenticated) {
                goto('/');
            }
        });
        return unsubscribe;
    });

    async function handleLogin() {
        if (!email || !password) {
            error = 'Email dan password harus diisi';
            return;
        }
        
        isLoading = true;
        error = '';
        
        try {
            const response = await fetch(`api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Assuming the API returns user data and token
                authStore.login({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    token: data.token
                });
                
                // Store token in localStorage for future requests
                localStorage.setItem('authToken', data.token);
                
                goto('/');
            } else {
                error = data.message || 'Email atau password salah';
            }
        } catch (err) {
            error = 'Terjadi kesalahan saat menghubungi server';
            console.error('Login error:', err);
        } finally {
            isLoading = false;
        }
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleLogin();
        }
    }
</script>

<svelte:head>
    <title>Login - MyWall CMS</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div>
            <div class="mx-auto h-12 w-12 flex items-center justify-center bg-blue-600 rounded-full">
                <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Masuk ke akun Anda
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
                MyWall CMS Dashboard
            </p>
        </div>

        <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
            {#if error}
                <div class="alert-error">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 
                               1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293
                               a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                    <p>{error}</p>
                </div>
            {/if}

            <div class="rounded-md shadow-sm -space-y-px">
                <input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                    bind:value={email}
                    on:keypress={handleKeyPress}
                    class="form-input-top"
                    placeholder="Alamat email"
                    disabled={isLoading}
                />
                <input
                    id="password"
                    name="password"
                    type="password"
                    autocomplete="current-password"
                    required
                    bind:value={password}
                    on:keypress={handleKeyPress}
                    class="form-input-bottom"
                    placeholder="Password"
                    disabled={isLoading}
                />
            </div>

            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                        Ingat saya
                    </label>
                </div>

                <div class="text-sm">
                    <a href="/forgot-password" class="font-medium text-blue-600 hover:text-blue-500">
                        Lupa password?
                    </a>
                </div>
            </div>

            <button type="submit" disabled={isLoading} class="btn-primary">
                {#if isLoading}
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10"
                                stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 
                                 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 
                                 014 12H0c0 3.042 1.135 5.824 3 
                                 7.938l3-2.647z"></path>
                    </svg>
                    Sedang masuk...
                {:else}
                    Masuk
                {/if}
            </button>

            <div class="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 class="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</h4>
                <p class="text-xs text-blue-800">
                    Email: <code class="bg-blue-100 px-1 py-0.5 rounded">admin@example.com</code><br>
                    Password: <code class="bg-blue-100 px-1 py-0.5 rounded">password</code>
                </p>
            </div>
        </form>
    </div>
</div>
