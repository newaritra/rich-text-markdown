import {
  EditorState,
  Modifier,
  SelectionState,
  getDefaultKeyBinding,
  ContentBlock,
  genKey,
  ContentState,
  convertToRaw,
  RichUtils,
} from "draft-js";

//The list of regex patterns which the line should be matched against to get the desired content block
const patternList = [
  { regex: /^#\s/gs, blockType: "header-one", inlineStyle: null }, //Creates a h1 header
  { regex: /^\*\s/gs, blockType: null, inlineStyle: "BOLD" }, //Creates a bold line
  { regex: /^\*{2}\s/gs, blockType: null, inlineStyle: "color-red" }, //Red Line
  {
    regex: /^\*{3}\s/gs,
    blockType: null,
    inlineStyle: "UNDERLINE",
  }, //Underline
  {
    regex: /^`{3}\s/gs,
    blockType: "code-block",
    inlineStyle: null,
  }, //Code block
];

const handleKeyCommand = (command, editorState, setEditorState) => {
  //Adding the basic key handlers for the draft editor
  const newState = RichUtils.handleKeyCommand(editorState, command);

  if (newState) {
    setEditorState(newState);
    return "handled";
  }

  return "not-handled";
};

const keyBindingFn = (e, editorState, setEditorState) => {
  //Create a "soft line" which does not create a new block with Shift+Enter
  if (e.shiftKey && e.key === "Enter") {
    const newContentState = RichUtils.insertSoftNewline(editorState);
    setEditorState(newContentState);
  } else if (e.key === "Enter" && !e.shiftKey) {
    //Create a new block using enter
    const currentContent = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const curBlock = currentContent.getBlockForKey(selection.getStartKey());
    const cursorPosition = selection.getFocusOffset();
    //If we press enter in the middle of the block we break the text into two sepearate block and persist the styles
    if (cursorPosition < curBlock.getLength()) {
      const textWithEntity = Modifier.splitBlock(currentContent, selection);
      setEditorState(
        EditorState.push(editorState, textWithEntity, "split-block")
      );
    } else {
      //If we are at the end of the line we can just create a new block after the current block
      let newBlock = new ContentBlock({
        key: genKey(),
        type: "paragraph",
        text: "",
      });
      let newBlockArray = currentContent.getBlocksAsArray();
      let curIndex = newBlockArray.findIndex(
        (block) => block.key === curBlock.getKey()
      );
      //We get the content state in the form of a block array and modify that array to add a new block after the current block
      newBlockArray = [
        ...newBlockArray.slice(0, curIndex + 1),
        newBlock,
        ...newBlockArray.slice(curIndex + 1),
      ];
      //Create a content state with the new block array
      let newContentState = ContentState.createFromBlockArray(newBlockArray);

      const selectionState = new SelectionState({
        anchorKey: newContentState.getBlockAfter(curBlock.getKey()).getKey(),
        anchorOffset: 0,
        focusKey: newContentState.getBlockAfter(curBlock.getKey()).getKey(),
        focusOffset: curBlock.getLength(),
        hasFocus: true,
      });
      let newEditorState = EditorState.createWithContent(newContentState);
      //Move the cursor to the newly created block
      newEditorState = EditorState.forceSelection(
        newEditorState,
        selectionState
      );
      //Create the the new editor state
      setEditorState(
        EditorState.push(
          newEditorState,
          newEditorState.getCurrentContent(),
          "move-block"
        )
      );
    }
  } else return getDefaultKeyBinding(e);
};

const handleBeforeInput = (char, editorState, setEditorState) => {
  let contentState = editorState.getCurrentContent();
  let selectionState = editorState.getSelection();
  const curBlock = contentState.getBlockForKey(selectionState.getStartKey());
  let curBlockText = curBlock.getText();
  let selection = new SelectionState({
    anchorKey: curBlock.getKey(),
    anchorOffset: 0,
    focusKey: curBlock.getKey(),
    focusOffset: curBlock.getLength(),
  });
  let textForCheck = curBlockText + char;
  // We add the incoming character to the existent text in the block and check it aginst the regex map that we have
  let patternCheck = patternList.find((pat) => pat.regex.exec(textForCheck));
  if (patternCheck) {
    //On matching we replace the text in the block with an empty string
    let newContentState = Modifier.replaceText(contentState, selection, "", [
      patternCheck.inlineStyle,
    ]);
    //If we want to create a new block type we have to set it using a modifier
    if (patternCheck.blockType) {
      newContentState = Modifier.setBlockType(
        newContentState,
        selection,
        patternCheck.blockType
      );
    }
    let newEditorState = EditorState.push(
      editorState,
      newContentState,
      "replace-text"
    );
    //Mode the cursor to the current block
    newEditorState = EditorState.forceSelection(
      newEditorState,
      new SelectionState({
        anchorKey: curBlock.getKey(),
        anchorOffset: 0,
        focusKey: curBlock.getKey(),
        focusOffset: 0,
        hasFocus: true,
      })
    );
    // Add the custom style we have sprecified using the toggle style function
    newEditorState = RichUtils.toggleInlineStyle(
      newEditorState,
      patternCheck.inlineStyle
    );
    setEditorState(newEditorState);
    return "handled";
  }
  return "not-handled";
};

const storeContentState = (editorState) => {
  //Store the content state in raw format using local storage
  const contentState = editorState.getCurrentContent();
  console.log(contentState);
  localStorage.setItem(
    "contentState",
    JSON.stringify(convertToRaw(contentState))
  );
};

export { storeContentState, keyBindingFn, handleBeforeInput, handleKeyCommand };
