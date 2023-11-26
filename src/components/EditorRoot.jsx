import { EditorState, Editor, convertFromRaw } from "draft-js";
import React, { useEffect, useState } from "react";
import styles from "../styles/EditorRoot.module.css";
import "draft-js/dist/Draft.css";
import {
  storeContentState,
  handleBeforeInput,
  keyBindingFn,
  handleKeyCommand,
} from "../utils/handlers";

const customeStyleMap = {
  "color-red": {
    color: "red",
  },
  unset: { all: "initial" },
};

const EditorRoot = () => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  useEffect(() => {
    //Fetches the content state in raw format and sets it in the editor state
    let storedContentState = JSON.parse(localStorage.getItem("contentState"));
    console.log(storedContentState);
    if (storedContentState) {
      storedContentState = convertFromRaw(storedContentState);
      const newEditorState = EditorState.createWithContent(storedContentState);
      console.log(storedContentState);
      setEditorState(newEditorState);
    }
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "50px",
        flexDirection: "column",
        padding: "20px",
      }}
      className="container"
    >
      <div className={styles.detailsBar}>
        <h3>Demo Editor by Aritra Roy 🧑🏽‍💻</h3>
        <button onClick={() => storeContentState(editorState)}>Save</button>
        <button
          style={{ background: "#cf0e0e" }}
          onClick={() => {
            localStorage.clear();
            setEditorState(EditorState.createEmpty());
          }}
        >
          Delete
        </button>
      </div>
      <div className={styles.root}>
        <Editor
          className={styles.editor}
          editorState={editorState}
          customStyleMap={customeStyleMap}
          onChange={setEditorState}
          keyBindingFn={(e) => keyBindingFn(e, editorState, setEditorState)}
          handleKeyCommand={(e) =>
            handleKeyCommand(e, editorState, setEditorState)
          }
          handleBeforeInput={(e) =>
            handleBeforeInput(e, editorState, setEditorState)
          }
          placeholder="Type here...✨"
        />
      </div>
    </div>
  );
};

export default EditorRoot;
