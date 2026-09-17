import React from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import Progress from "./Progress";
import WordCount from "./WordCount";
import WriteButton from "./WriteButton";
import Failure from "./Failure";
import Download from "./Download";
import Editor from "./Editor";
import { AppContext } from "./AppContext";
import { STORAGE_KEYS, saveEntry, readSettings } from "./Workspace";

const withFullscreenHook = (Component) => {
  return (props) => {
    const handle = useFullScreenHandle();
    return <Component fullscreenHandler={handle} {...props} />;
  };
};

class WritingApp extends React.Component {
  constructor(props) {
    super(props);

    let { limit, type, hardcore, nightmode, morning, fullscreenHandler } = this.props;
    this.handleStroke = this.handleStroke.bind(this);
    this.fullscreenHandler = fullscreenHandler;
    this.reset = this.reset.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.toggleNightMode = this.toggleNightMode.bind(this);
    this.now = this.now.bind(this);
    this.editor = React.createRef();
    this.audioContext = null;
    this.warningOscillator = null;
    this.warningGain = null;

    this.state = {
      run: false,
      startTime: null,
      fullscreen: false,
      nightMode:
        nightmode !== null
          ? nightmode
          : localStorage.getItem("mdwa.night-mode") === "true",
      progress: 0,
      timeSinceStroke: 0,
      danger: false,
      won: false,
      lost: false,
      fade: 2,
      kill: 5,
      limit: limit,
      type: type,
      hardcore: hardcore,
      morning: morning || false,
      warningSound: readSettings().warningSound,
    };
  }

  componentDidMount() {
    if (window.plausible) window.plausible("Editor");
  }

  componentWillUnmount() {
    this.stopWarningSound();
    this.stopWriting();
    if (this.audioContext) this.audioContext.close();
  }

  startWarningSound() {
    if (!this.state.warningSound || this.warningOscillator) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.audioContext = this.audioContext || new AudioContext();
    this.audioContext.resume();
    this.warningOscillator = this.audioContext.createOscillator();
    this.warningGain = this.audioContext.createGain();
    this.warningOscillator.type = "sine";
    this.warningOscillator.frequency.value = 440;
    const now = this.audioContext.currentTime;
    const rampIn = Math.min(0.04, Math.max(0.01, (this.state.kill - this.state.fade) / 10));
    this.warningGain.gain.setValueAtTime(0, now);
    this.warningGain.gain.linearRampToValueAtTime(0.12, now + rampIn);
    this.warningGain.gain.linearRampToValueAtTime(0.12, now + this.state.kill - this.state.fade);
    this.warningOscillator.connect(this.warningGain);
    this.warningGain.connect(this.audioContext.destination);
    this.warningOscillator.start(now);
  }

  stopWarningSound() {
    if (!this.warningOscillator || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.warningGain.gain.cancelScheduledValues(now);
    this.warningGain.gain.setValueAtTime(this.warningGain.gain.value, now);
    this.warningGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
    this.warningOscillator.stop(now + 0.06);
    this.warningOscillator.disconnect();
    this.warningGain.disconnect();
    this.warningOscillator = null;
    this.warningGain = null;
  }

  startWriting() {
    if (window.plausible) window.plausible("Start Writing");
    if (!this.fullscreenHandler.active) this.fullscreenHandler.enter();
    this.setState({
      run: true,
      fullscreen: true,
      startTime: this.now(),
      timerID: setInterval(() => this.tick(), 100),
    });
  }

  toggleNightMode() {
    localStorage.setItem("mdwa.night-mode", !this.state.nightMode);
    this.setState((prevState, props) => ({ nightMode: !prevState.nightMode }));
  }

  toggleFullscreen() {
    if (this.fullscreenHandler.active) this.fullscreenHandler.exit();
    else this.fullscreenHandler.enter();

    this.setState((prevState, props) => ({
      fullscreen: !prevState.fullscreen,
    }));
  }

  handleStroke(char, text) {
    if (this.state.warningSound && !this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.audioContext = new AudioContext();
    }
    if (this.audioContext) this.audioContext.resume();
    if (!this.state.run && !this.state.won) this.startWriting();
    this.toggleDanger(false);
    const words = text.trim().length && text.trim().split(/\s+/).length;
    this.setState({
      text,
      words,
      timeSinceStroke: 0,
    });
  }

  stopWriting() {
    clearInterval(this.state.timerID);
    this.stopWarningSound();
  }

  toggleDanger(on) {
    if (this.state.danger === on) return;
    this.setState({ danger: on });
  }

  now() {
    return new Date().getTime() / 1000;
  }

  win() {
    this.stopWriting();
    this.setState({
      won: true,
      run: false,
    });
    saveEntry(this.state.morning ? STORAGE_KEYS.morningPages : STORAGE_KEYS.sessions, {
      id: Date.now(),
      text: this.state.text || "",
      words: this.state.words || 0,
      type: this.state.type,
      limit: this.state.limit,
      startedAt: this.state.startTime * 1000,
      finishedAt: Date.now(),
    });
    if (window.plausible) window.plausible("Win");
  }

  fail() {
    this.stopWriting();
    this.setState({ lost: true });
    if (window.plausible) window.plausible("Fail");
  }

  reset(type, limit, hardcore) {
    this.setState({
      type,
      limit,
      hardcore,
      won: false,
      lost: false,
      run: false,
      startTime: null,
      progress: 0,
      timeSinceStroke: 0,
      danger: false,
      words: 0,
    });
    this.editor.current && this.editor.current.reset();
  }

  tick() {
    const { run, words, timeSinceStroke, startTime, fade, type, limit, kill } =
      this.state;
    if (!run) return;
    const danger = timeSinceStroke >= fade;
    if (danger) this.startWarningSound();
    else this.stopWarningSound();
    if (timeSinceStroke >= kill) return this.fail();
    const duration = this.now() - startTime;
    const progress = (type === "minutes" ? duration / 60.0 : words) / limit;
    if (progress >= 1) this.win();

    this.setState((prevState, props) => ({
      words,
      progress,
      danger,
      timeSinceStroke: prevState.timeSinceStroke + 0.1,
      startTime,
      duration
    }));
  }

  render() {
    const { danger, won, lost, text, nightMode, limit, type, hardcore, startTime, duration } =
      this.state;
    const appClass = classNames("app", {
      "night-mode": nightMode,
      danger: danger,
    });
    return (
      <FullScreen handle={this.fullscreenHandler}>
        <AppContext.Provider value={this.state}>
          <div className={appClass}>
            <Failure />
            <Progress />
            <Link to="/" className="writing-home" aria-label="Return home">
              <i className="icon-mdwa" aria-hidden="true"></i>
            </Link>
            <div className="buttons">
              {won && <Download finishTime={startTime + duration} text={text} />}
              <i className="icon-night-mode" onClick={this.toggleNightMode}></i>
              <i
                className="icon-fullscreen"
                onClick={this.toggleFullscreen}
              ></i>
            </div>
            {!lost && (
              <div className="content">
                <Editor
                  ref={this.editor}
                  won={won}
                  onStroke={this.handleStroke}
                  onNightMode={this.toggleNightMode}
                  onFullScreen={this.toggleFullscreen}
                />
                {won ? (
                  <WriteButton
                    small
                    ghost
                    hidePanel
                    label="Start Again"
                    {...{ limit, type, hardcore }}
                  />
                ) : (
                  <WordCount />
                )}
              </div>
            )}
          </div>
        </AppContext.Provider>
      </FullScreen>
    );
  }
}

export default withFullscreenHook(WritingApp);
