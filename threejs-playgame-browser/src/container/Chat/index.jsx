import React, { useState, useEffect } from 'react';
import './index.scss';
import { STATES, EMOTES, SYSTEM_WORDS } from '../../constants';
import Bus from '../../eventBus';

const MY_NAME = '堂堂唐家大姐';
let chatIndex = 0; // 聊天轮数

function Chat() {
  const [isMsgShow, setMsgShow] = useState(false);
  const [isActionShow, setActionShow] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [msgs, setMsgs] = useState([]);

  useEffect(() => {
    setTimeout(() => systemAction(chatIndex), 2000);
  }, []);

  function toggleShowStatus(isMsgShow, isActionShow) {
    setMsgShow(false || isMsgShow);
    setActionShow(false || isActionShow);
  }

  function handleAction(item) {
    Bus.emit('changeSystemStatus', item);
  }

  function handleInput(e) {
    setInputValue(e.target.value);
  }

  function sendMsg() {
    setMsgs(
      msgs.concat({
        name: MY_NAME,
        msg: inputValue,
        id: new Date(),
      })
    );

    speak(inputValue);

    actionRule(inputValue);
    setInputValue('');
    Bus.emit('createGuestText', inputValue);

    // 系统回复消息
    setTimeout(() => {
      chatIndex++;
      systemAction(chatIndex);
    }, 1000);
  }

  function speak(words) {
    if (!words) {
      return;
    }
    const say = new window.SpeechSynthesisUtterance(words);
    window.speechSynthesis.speak(say);
  }

  function systemAction(chatIndex) {
    const { msg = '', action = '' } = SYSTEM_WORDS[chatIndex];
    Bus.emit('createSystemText', msg);
    // todo
    // setMsgs(
    //   msgs.concat({
    //     name: 'Robot',
    //     msg: result.msg,
    //     id: new Date(),
    //   })
    // );
    speak(msg);
    action && Bus.emit('changeSystemStatus', action);
  }

  function actionRule(msg) {
    msg && Bus.emit('changeGuestStatus', msg);
  }

  return (
    <div>
      {isMsgShow && (
        <div className="chat-wrap">
          <div className="avatar-container">
            <img className="avatar" src={require('../../resources/images/user.png')} />
          </div>
          <div className="chat-container">
            <div className="msg-wrap">
              {msgs.length
                ? msgs.map((item) => (
                    <div key={item.id}>
                      <p className="msg-title">{item.name}</p>
                      <p className="msg-con">{item.msg}</p>
                    </div>
                  ))
                : null}
            </div>
            <textarea className="edit" onChange={handleInput} value={inputValue} />
          </div>
          <div className="send-btn" onClick={sendMsg}>
            发送
          </div>
        </div>
      )}
      {isActionShow && (
        <div className="aciton-wrap">
          <div className="stat">
            {STATES.map((item) => (
              <span key={item} onClick={() => handleAction(item)}>
                {item}
              </span>
            ))}
          </div>
          <div className="emotes">
            {EMOTES.map((item) => (
              <span key={item} onClick={() => handleAction(item)}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="float-btn">
        <img
          className="action-btn"
          onClick={() => toggleShowStatus(!isMsgShow, false)}
          src={require('../../resources/images/liaotian.png')}
        />
        <img
          className="action-btn"
          onClick={() => toggleShowStatus(false, !isActionShow)}
          src={require('../../resources/images/dongzuo.png')}
        />
      </div>
    </div>
  );
}

export default Chat;
