const STATES = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing'];
const EMOTES = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];

// 系统话术
const SYSTEM_WORDS = [{
    // msg: '欢迎来到王者峡谷',
    msg: 'Welcome to kings canyon',
    action: '',
  },
  {
    // msg: '快来领你的新手任务 跟我学动作',
    msg: 'Come on, get your new task, follow me action',
    action: '',
  },
  {
    // msg: '走路',
    msg: 'Walking',
    action: 'Walking',
  },
  {
    // msg: '下一步来学习跑步吧',
    msg: 'OK, next learn the running',
    action: 'Running',
  },
  {
    // msg: '太棒了',
    msg: 'Great',
    action: 'ThumbsUp',
  },
  {
    // msg: '接下来学跳舞吧',
    msg: 'next dance',
    action: 'Dance',
  },
  {
    // msg: '笨死了这都不会',
    msg: 'You are so stupid!',
    action: 'Death',
  },
  {
    // msg: '拜拜',
    msg: 'Bye Bye',
    action: 'Wave',
  }
]

const MSG_ACTION_RULE = {
  // '好的': 'yes',
  // '不会': 'no',
  // '走路': 'walk',
  // '跑步': 'run',
  // '拜拜': 'bye',
  'yes': 'yes',
  'no': 'no',
  'walk': 'walk',
  'run': 'run',
  'bye': 'bye',
}

export {
  STATES,
  EMOTES,
  SYSTEM_WORDS,
  MSG_ACTION_RULE
}