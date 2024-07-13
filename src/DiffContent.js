import * as monaco from "monaco-editor";
import { merge } from "./utils/util";

const defaultOptions = {
    useLineDiff: false,
};

const editDefaultOptions = {
    renderOverviewRuler: false,
    useInlineViewWhenSpaceIsLimited: false,
    renderSideBySide: true,
    automaticLayout: true,
    originalEditable: true,
};

let DIFF_IDX = 0;
/**
 *
 */
export class DiffContent {
    constructor(element, options) {
        if (!element) {
            throw new Error("[${element}] element not found");
        }
        this.options = merge({}, defaultOptions, options);
        this.config = {
            diffLineElement: null,
        };

        if (this.options.useLineDiff) {
            const elementSelector = `daraSqlEditorDiff_${++DIFF_IDX}`;
            element.innerHTML = `
                <div id="${elementSelector}" style="width:100%;height:calc(100% - 45px);border:1px solid #dddddd;margin-bottom:5px;"></div>
                <div id="${elementSelector}LineDiff" style="width:100%;height:40px;border:1px solid #dddddd;"></div>
            `;

            this.element = document.getElementById(elementSelector);
            this.config.diffLineElement = document.getElementById(`${elementSelector}LineDiff`);
        } else {
            this.element = element;
        }

        this.editorOptions = merge({}, editDefaultOptions, options.editorOptions);
        this.lineDiffViewer = null;
        this.create();
    }

    create() {
        this.diffEditor = monaco.editor.createDiffEditor(this.element, this.editorOptions);

        // viewer 활성화 여부.
        //diffEditorObj.diffEditor._accessibleDiffViewer.value._visible.value

        if (this.options.useLineDiff) {
            this.diffEditor.getOriginalEditor().onMouseUp((event) => {
                const position = event.target.position;
                const lineNumber = (position||{}).lineNumber;
                this.lineDiff(lineNumber);
            });

            this.diffEditor.getModifiedEditor().onMouseUp((event) => {
                const position = event.target.position;
                const lineNumber = (position||{}).lineNumber;
                this.lineDiff(lineNumber);
            });

            this.lineDiffViewer = monaco.editor.createDiffEditor(this.config.diffLineElement, {
                renderOverviewRuler: false,
                useInlineViewWhenSpaceIsLimited: false,
                originalEditable: true,
                renderSideBySide: false, // 차이점을 좌우로 나란히 표시하는 옵션
                automaticLayout: true,
                lineNumbers: "off", // Line numbers off
                glyphMargin: false, // Glyph margin off
                readOnly: true,
                scrollBeyondLastLine: false, // 마지막 줄 이후 스크롤 비활성화
                scrollbar: {
                    vertical: "hidden", // 수직 스크롤바 숨기기
                    horizontal: "hidden", // 수평 스크롤바 숨기기
                },
            });
        }
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

    prev = () => {
        this.diffEditor.goToDiff("previous");
    };

    next = () => {
        this.diffEditor.goToDiff("next");
    };

    viewerPrev = () => {
        this.diffEditor.accessibleDiffViewerPrev();
    };

    viewerNext = () => {
        this.diffEditor.accessibleDiffViewerNext();
    };

    lineDiff(lineNumber) {

        if(lineNumber ==null || lineNumber==""|| typeof lineNumber ==='undefined'){
            return ; 
        }

        if (this.options.useLineDiff) {
            const orginEditor = this.diffEditor.getOriginalEditor().getModel();
            const modifiedEditor = this.diffEditor.getModifiedEditor().getModel();
            let orginContent = null,
                modifiedContent = null;
            if (orginEditor.getLineCount() >= lineNumber) {
                orginContent = orginEditor.getLineContent(lineNumber);
            }

            if (modifiedEditor.getLineCount() >= lineNumber) {
                modifiedContent = modifiedEditor.getLineContent(lineNumber);
            }

            this.lineDiffViewer.setModel({
                original: monaco.editor.createModel(orginContent, "plaintext"),
                modified: monaco.editor.createModel(modifiedContent, "plaintext"),
            });
        }
    }

    viewerOpen = () => {
        this.diffEditor.updateOptions({ onlyShowAccessibleDiffViewer: true });
        this.diffEditor._accessibleDiffViewer.value._setVisible(true);
    };

    viewerClose = () => {
        this.diffEditor.updateOptions({ onlyShowAccessibleDiffViewer: false });
        this.diffEditor._accessibleDiffViewer.value._setVisible(false);
    };

    updateEditorOptions = (opts) => {
        this.diffEditor.updateOptions(opts);
    };
}
