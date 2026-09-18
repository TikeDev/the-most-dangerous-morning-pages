import React from 'react';
import FileSaver from 'file-saver';
import {AppContext} from './AppContext';

export default class Download extends React.Component {
  constructor(props) {
    super(props);
    this.download = this.download.bind(this);
  }

  download () {
    const now = new Date();
    const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((part) => String(part).padStart(2, "0"))
      .join("_");
    // Replace clean newlines with windows evil
    const text = this.props.text.replace(/([^\r])\n/g, "$1\r\n");
    const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    const filename = `${date}_morning_pages.md`;
    FileSaver.saveAs(blob, filename);
  }

  render() {
    return (
      <AppContext.Consumer>
      { ({words}) =>
          <button onClick={this.download} className="tiny ghost">Download { words || 0 } { words === 1 ? "word" : "words" }</button>
      }
      </AppContext.Consumer>
    )
  }
}
