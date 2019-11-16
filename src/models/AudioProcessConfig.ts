export type Stem = 2 | 4 | 5;

export interface AudioProcessConfig {
    name: string;
    pathToSpleeterDir: string;
    stems: Stem;
    isolate: Set<string>;
    remove: Set<string>;

}
