import * as monaco from "monaco-editor";
import { getDefineInfo } from "./language/allLanguage";
import { WordSuggestion } from "./WordSuggestion";
import { merge } from "./utils/util";
import { DiffContent } from "./DiffContent";

const defaultOptions = {
    width: "", // toast width
    keyEvents: {
        save: () => {
            //console.log("save");
        },
        history: (mode) => {
            // console.log("history", mode);
        },
        executeSql: () => {
            //console.log("executeSql");
        },
        sqlFormat: () => {
            //console.log("sqlFormat");
        },
    },
    usePaste: false,
    change: () => {},
    contextItems: [],
    onContextMenu: (evt, target) => {},
    message: {
        execute: "Execute",
        format: "Format",
        cut: "Cut",
        paste: "Paste",
        copy: "Copy",
    },
};

const editorOption = {
    value: "",
    language: "sql",
    wordWrap: false,
    minimap: { enabled: false },
    automaticLayout: true,
    contextmenu: true,
    theme: "vs-light",
    fontSize: 12,
    minimap: { enabled: true },
    scrollbar: {
        useShadows: false,
        vertical: "visible",
        horizontal: "visible",
        horizontalScrollbarSize: 12,
        verticalScrollbarSize: 12,
        alwaysConsumeMouseWheel: false,
    },
};

/**
 * moancode editor 모듈
 */
export class codeEditor {
    static VERSION = APP_VERSION;

    constructor(element, options) {
        if (!element) {
            throw new Error("[${element}] element not found");
        }
        this.element = element;
        this.options = merge({}, defaultOptions, options);
        this.config = {
            allModel: {},
            currentContent: {
                sqlId: "",
            },
            allState: {},
            history: {
                back: [],
                forward: [],
            },
        };

        this.create();
    }

    static diffEditor(element, options) {
        return new DiffContent(element, options);
    }

    static setOptions(options) {
        defaultOptions = merge({}, defaultOptions, options);
    }

    /**
     * editor 생성
     */
    create = () => {
        const opt = this.options;

        this.defineInfo = getDefineInfo(opt.mimeType);

        this.editorOptions = merge({}, editorOption, opt.editorOptions);

        monaco.languages.register({ id: "sql" });
        this.editor = monaco.editor.create(this.element, this.editorOptions);
        this.viewContent(opt.contentInfo || {}, true);
        this.initEvent();
        this.suggestInfo = new WordSuggestion(this.defineInfo, opt);

        if (opt.onContextMenu) {
            this.editor.onContextMenu(opt.onContextMenu);
        }
    };

    /**
     *
     * @param {Object} opts
     * {
     *  theme : vs, vs-dark
     *  wordWrap : 'on', 'off'
     * }
     */
    updateEditorOptions = (opts) => {
        this.editorOptions = merge({}, this.editorOptions, opts);
        this.editor.updateOptions(opts);
    };

    getEditorOption = (optKey) => {
        if (monaco.editor.EditorOption[optKey]) {
            return this.editor.getOption(monaco.editor.EditorOption[optKey]);
        }
    };

    /**
     * init editor event 처리
     */
    initEvent() {
        const opts = this.options;
        const keyEvts = opts.keyEvents;
        // 변경된 내용 체크.
        this.editor.onDidChangeModelContent(() => {
            opts.change();
        });

        // custom event
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            keyEvts.save();
        });

        // Shift+Ctrl+/ 키 조합 커스텀 명령 추가
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash, () => {
            this.editor.trigger("keyboard", "editor.action.commentLine");
        });

        // Shift+Ctrl+C 키 조합 커스텀 명령 추가
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
            this.editor.trigger("keyboard", "editor.action.commentLine");
        });

        // Shift+Ctrl+K 키 조합 커스텀 명령 추가
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, (e) => {
            this.editor.trigger("keyboard", "editor.action.deleteLines");
        });

        // Alt+Left 키 커스텀 명령 추가
        this.editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.LeftArrow, () => {
            this.history("back");
        });

        // Alt+Right 키 커스텀 명령 추가
        this.editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.RightArrow, () => {
            this.history("forward");
        });

        this.editor.addAction({
            id: "varsql.sql.execute",
            label: this.options.message.execute,
            contextMenuOrder: 1,
            contextMenuGroupId: "navigation",
            keybindings: [monaco.KeyCode.F11, monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run: function (ed) {
                keyEvts.executeSql();
            },
        });

        //Ctrl+Alt+F
        this.editor.addAction({
            id: "varsql.custom.editor1",
            label: this.options.message.format,
            contextMenuOrder: 1.1,
            contextMenuGroupId: "1_modification",
            keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
            run: (ed) => {
                keyEvts.sqlFormat();
            },
        });

        this.editor.addAction({
            id: "varsql.transformToUpperCase",
            label: "Transform to Upper Case",
            contextMenuGroupId: "1_modification",
            contextMenuOrder: 1.2,
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyU],
            run: (ed) => {
                this.editor.trigger("keyboard", "editor.action.transformToUppercase");
            },
        });

        this.editor.addAction({
            id: "varsql.transformToLowercase",
            label: "Transform to Lower Case",
            contextMenuGroupId: "1_modification",
            contextMenuOrder: 1.3,
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL],
            run: (ed) => {
                this.editor.trigger("keyboard", "editor.action.transformToLowercase");
            },
        });

        this.editor.addAction({
            id: "varsql.cut",
            label: this.options.message.cut,
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX],
            contextMenuGroupId: "9_cutcopypaste",
            contextMenuOrder: 1,
            run: function (ed) {
                ed.trigger("keyboard", "editor.action.clipboardCutAction");
            },
        });

        this.editor.addAction({
            id: "varsql.copy",
            label: this.options.message.copy,
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
            contextMenuGroupId: "9_cutcopypaste",
            contextMenuOrder: 1.1,
            run: function (ed) {
                ed.trigger("keyboard", "editor.action.clipboardCopyAction");
            },
        });

        if (this.options.usePaste && (navigator.clipboard || document.queryCommandSupported("paste")) && window.isSecureContext) {
            this.editor.addAction({
                id: "varsql.paste",
                label: this.options.message.paste,
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
                contextMenuGroupId: "9_cutcopypaste",
                contextMenuOrder: 1.2,
                run: function (ed) {
                    ed.trigger("keyboard", "editor.action.clipboardPasteAction");
                },
            });
        }

        const contextItems = this.options.contextItems;

        if (Array.isArray(contextItems)) {
            let idx = 0;
            for (let contextItem of contextItems) {
                let addItem = {
                    id: "varsql.custom.context_" + ++idx,
                    label: contextItem.label,
                    contextMenuGroupId: "3_customcontextmenu",
                    contextMenuOrder: idx,
                    run: function (ed) {
                        if (contextItem.action) {
                            contextItem.action(ed);
                        }
                    },
                };

                if (contextItem.hotKey) {
                    addItem.keybindings = contextItem.hotKey;
                }
                this.editor.addAction(addItem);
            }
        }

        // 불필요한 컨텍스트 메뉴 제거.
        //const removableIds = ["editor.action.quickCommand", "editor.action.clipboardCutAction", "editor.action.clipboardCopyAction", "editor.action.clipboardPasteAction"];
        const removableIds = [];
        const contextmenu = this.editor.getContribution("editor.contrib.contextmenu");
        const realMethod = contextmenu._getMenuActions;

        contextmenu._getMenuActions = function () {
            const items = realMethod.apply(contextmenu, arguments);
            return items.filter(function (item) {
                return !removableIds.includes(item.id);
            });
        };
    }

    /**
     * view content
     *
     * @param {Object} contentInfo - editor content info
     * sqlId : ''
     * sqlCont : editor content
     * position : {scrollTop : 0, scrollLeft: 0}
     * @isHistory boolean history
     *
     */
    viewContent = (contentInfo, isHistory) => {
        const sqlId = contentInfo.sqlId;

        if (!sqlId) {
            return;
        }

        let viewModel = this.config.allModel[sqlId];
        if (typeof viewModel === "undefined") {
            this.config.allModel[sqlId] = viewModel = monaco.editor.createModel(contentInfo.sqlCont, "sql");
            this.config.allState[this.config.currentContent.sqlId] = {};
        }

        if (contentInfo["_isChange"] === "undefined") {
            contentInfo["_isChange"] = false;
        }

        if (isHistory !== false) {
            this.history("add", contentInfo);
        }

        this.config.allState[this.config.currentContent.sqlId] = {
            viewState: this.editor.saveViewState(),
            cursorPosition: this.editor.getPosition(),
        };

        this.editor.setModel(viewModel);

        // 스크롤 위치 반영.
        let viewState = (this.config.allState[sqlId] || {}).viewState;
        if (typeof viewState === "undefined") {
            let position = { lineNumber: 1, column: 1 };
            try {
                if (contentInfo.editorCursor) {
                    position = JSON.parse(contentInfo.editorCursor);
                }
            } catch (e) {
                //console.log(e);
            }

            const movePostion = new monaco.Position(position.lineNumber || 1, position.column || 1);
            this.editor.setPosition(movePostion);
            this.editor.revealPosition(movePostion, monaco.editor.ScrollType.Immediate);
        } else {
            this.editor.restoreViewState(viewState);
        }

        this.editor.focus();
        this.config.currentContent = contentInfo;
    };

    /**
     * editor tab 제거
     *
     * @param {Object} contentInfo sql 정보
     */
    removeContent = (contentInfo) => {
        const sqlId = contentInfo.sqlId;
        delete this.config.allModel[sqlId];
        delete this.config.allState[sqlId];
        this.history("back");
    };

    /**
     * content 여부
     *
     * @param {String} sqlId sql id
     * @returns {Boolean} content 여부
     */
    existsContent = (sqlId) => {
        return this.config.allModel[sqlId] ? true : false;
    };

    getSqlDefineInfo = (dbtype) => {
        return getDefineInfo(dbtype);
    };

    addSuggestionInfo = (schema, type, objectInfo) => {
        this.suggestInfo.addDbObject(schema, type, objectInfo);
    };

    changeLanguage = (language) => {
        var currentValue = this.editor.getValue();
        var newModel = monaco.editor.createModel(currentValue, language);
        this.editor.setModel(newModel);
    };

    history = (mode, historyItem) => {
        const backArr = this.config.history.back,
            forwardArr = this.config.history.forward;

        const keyEvts = this.options.keyEvents;

        if (mode == "back") {
            const backArrLen = backArr.length;

            if (backArrLen > 0) {
                forwardArr.push({
                    sqlId: this.config.currentContent.sqlId,
                });
            }

            let beforeItem = {};
            for (let i = 0; i < backArrLen; i++) {
                let viewItem = backArr.pop();

                if (viewItem.sqlId != this.config.currentContent.sqlId && viewItem.sqlId != beforeItem.sqlId) {
                    this.viewContent(viewItem, false);
                    keyEvts.history(viewItem, "back");
                    break;
                }

                beforeItem = viewItem;
            }
            return;
        }

        if (mode == "forward") {
            const forwardArrLen = forwardArr.length;

            if (forwardArrLen > 0) {
                backArr.push({
                    sqlId: this.config.currentContent.sqlId,
                });
            }

            let beforeItem = {};
            for (let i = 0; i < forwardArrLen; i++) {
                let viewItem = forwardArr.pop();

                if (viewItem.sqlId != this.config.currentContent.sqlId && viewItem.sqlId != beforeItem.sqlId) {
                    this.viewContent(viewItem, false);
                    keyEvts.history(viewItem, "forward");
                    break;
                }
                beforeItem = viewItem;
            }
            return;
        }

        if (mode == "add") {
            if (this.config.currentContent.sqlId) {
                backArr.push({
                    sqlId: this.config.currentContent.sqlId,
                });
            }
            backArr.push(historyItem);
            this.config.history.forward = [];
            return;
        }

        if (mode == "remove") {
            // remove 처리 할것.
            const backArrLen = backArr.length,
                forwardArrLen = forwardArr.length;

            const len = Math.max(backArrLen, forwardArrLen);

            for (let i = len - 1; i >= 0; i--) {
                if (i < backArrLen) {
                    if (backArr[i].sqlId == historyItem.sqlId) {
                        backArr.splice(i, 1);
                    }
                }

                if (i < forwardArrLen) {
                    if (forwardArr[i].sqlId == historyItem.sqlId) {
                        forwardArr.splice(i, 1);
                    }
                }
            }
        } else if (mode == "removeAll") {
            this.config.history = { back: [], forward: [] };
        } else if (mode == "removeOther") {
            this.config.history = { back: [], forward: [] };
        }
    };

    /**
     * editor content value
     *
     * @param {String} sqlid
     * @returns {String}
     */
    getValue = (sqlId) => {
        if (sqlId) {
            if (this.config.allModel[sqlId]) {
                return this.config.allModel[sqlId].getValue();
            }
            return "";
        }
        return this.editor.getValue();
    };

    /**
     * set content
     *
     * @param {String} content
     * @returns
     */
    setValue = (content, language) => {
        this.editor.setValue(content);
        if (language) {
            this.changeLanguage(language);
        }
    };

    /**
     * 선택된 editor 값
     *
     * @param {String} mode
     * @returns {String}
     */
    getSelectionValue = (mode) => {
        return this.editor.getModel().getValueInRange(this.editor.getSelection());
    };

    /**
     * 
     * @param {Object} range 
     * {
      startLineNumber :1
      ,startColumn :2
      ,endLineNumber :9
      ,endColumn : 3
      }
     */
    setSelection = (range) => {
        const r = new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
        this.editor.setSelection(r);
        this.editor.revealLineInCenter(range.startLineNumber);
    };
    /**
     * insert text
     *
     * @param {String} str 추가 할값
     * @param {boolean} replaceFlag
     * @returns
     */
    insertText = (str, replaceFlag) => {
        if (this.editor == null) {
            return;
        }
        let position = {};
        if (replaceFlag) {
            position = this.editor.getSelection();
        } else {
            position = this.editor.getPosition();
            position = {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            };
        }

        const range = new monaco.Range(position.startLineNumber, position.startColumn, position.endLineNumber, position.endColumn);

        this.editor.executeEdits("", [
            {
                range: range,
                text: str,
                forceMoveMarkers: true,
            },
        ]);

        let lineTextArr = str.split(/\n/g);

        let movePostion;
        if (lineTextArr.length == 1) {
            movePostion = new monaco.Position(position.startLineNumber, position.startColumn + str.length);
        } else {
            movePostion = new monaco.Position(position.startLineNumber + lineTextArr.length - 1, lineTextArr[lineTextArr.length - 1].length);
        }

        this.editor.setPosition(movePostion);
        this.editor.revealPosition(movePostion, monaco.editor.ScrollType.Immediate);
        this.editor.focus();
    };

    replaceAllContent = (str) => {
        this.editor.setSelection({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: this.editor.getModel().getLineCount(),
            endColumn: this.editor.getModel().getLineMaxColumn(this.editor.getModel().getLineCount()),
        });

        this.insertText(str, true);
    };
    /**
     * 선택 영역 포지션 값
     * @returns {object} position
     * {
            endColumn : 0
            ,endLineNumber : 2
            ,startLineNumber :  2
            ,startColumn : 2
        }
     */
    getSelection = () => {
        const range = this.editor.getSelection();
        return {
            endColumn: range.endColumn,
            endLineNumber: range.endLineNumber,
            startLineNumber: range.startLineNumber,
            startColumn: range.startColumn,
        };
    };
    /**
     * get monaco editor object
     *
     * @returns {Editor Object} editor object
     */
    getEditor = () => {
        return this.editor;
    };

    /**
     * 커서 위치 값 
     * 
     * @param {String} sql id
     * @returns {object} cursor position
     * {
            lineNumber : 0
            ,column : 2
        }
     */
    getCursorPosition = (sqlId) => {
        if (sqlId && sqlId !== this.config.currentContent.sqlId) {
            if (this.config.allState[sqlId]) {
                return this.config.allState[sqlId].cursorPosition;
            }
            return {
                lineNumber: 1,
                column: 1,
            };
        }

        const range = this.editor.getPosition();
        return {
            lineNumber: range.lineNumber,
            column: range.column,
        };
    };

    /**
     * 실행취소
     */
    undo = () => {
        this.editor.getModel().undo();
    };

    /**
     *  되돌리기
     */
    redo = () => {
        this.editor.getModel().redo();
    };

    /**
     * 찾기 열기
     */
    find = () => {
        this.editor.trigger("keyboard", "actions.find");
    };

    /**
     * update editor option
     *
     * @param {Object} opt editor option
     */
    updateOptions = (opt) => {
        this.editor.updateOptions({
            theme: "vs-dark", // 테마 변경
            wordWrap: true,
        });
    };

    /**
     * editor resize
     *
     * @param {Object} size
     * {width:0, height:0}
     */
    resize = (size) => {
        this.editor.layout();
    };

    /**
     * editor focus
     *
     */
    focus = () => {
        this.editor.focus();
    };

    /**
     * toast destroy
     */
    destroy = () => {
        this.toastWrapperElement.remove();
    };
}
