// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '$service-worker' {
	export const build: string[];
	export const files: string[];
	export const version: string;
}

declare namespace NodeJS {
	interface ProcessEnv {
		MONGODB_URI: string;
	}
}


export {};
