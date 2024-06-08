declare module 'cc' {
    interface Component {
        /**
         * Call per frame in editor (Only use in editor)
         */
        onDrawGizmos(): void;
        /**
         * Call per frame in editor when node selected (Only use in editor)
         */
        onDrawGizmosSelected(): void;
    }
}
