import * as monaco from "monaco-editor";
import { merge } from "./utils/util";

const defaultOptions = {
    //    width: "", // width
    hideUnchangedRegions: {
        enabled: true,
    },
    renderOverviewRuler: false,
    useInlineViewWhenSpaceIsLimited: false,
    renderSideBySide: true,
    automaticLayout: true,
};
/**
 *
 */
export class DiffContent {
    constructor(element, options) {
        if (!element) {
            throw new Error("[${element}] element not found");
        }
        this.element = element;
        this.options = merge({}, defaultOptions, options);

        this.create();
    }

    create() {
        this.diffEditor = monaco.editor.createDiffEditor(this.element, this.options);
    }

    diff = (source, target, language) => {
        language = language || "sql";
        const leftModel = monaco.editor.createModel(source, language);
        const rightModel = monaco.editor.createModel(target, language);

        this.diffEditor.setModel({
            original: leftModel,
            modified: rightModel,
        });
    };
}
