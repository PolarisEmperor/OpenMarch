import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import "@fontsource/dm-mono";
import "@fontsource/dm-sans";
import { ThemeProvider } from "./context/ThemeContext";
import * as Sentry from "@sentry/electron/renderer";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const options = {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    capture_exceptions: true,
    debug: import.meta.env.MODE === "development",
};

if (import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, options);
}

if (!posthog.has_opted_out_capturing()) {
    Sentry.init({
        dsn: "https://72e6204c8e527c4cb7a680db2f9a1e0b@o4509010215239680.ingest.us.sentry.io/4509010222579712",
    });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <PostHogProvider client={posthog}>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </PostHogProvider>
    </React.StrictMode>,
);

postMessage({ payload: "removeLoading" }, "*");
