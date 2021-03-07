import PropTypes from 'prop-types';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  PanResponder,
  TouchableWithoutFeedback,
  Dimensions,
  LogBox,
} from 'react-native';

class ConsolePanel extends React.PureComponent {
  static propTypes = {
    limit: PropTypes.number,
    open: PropTypes.bool,
    style: PropTypes.object,
  };

  static defaultProps = {
    limit: 10,
    open: true,
    style: {},
  };

  constructor(props) {
    super(props);
    this.state = { dataSource: [], isOpen: this.props.open, unreadCount: 0 };
    console.log({ props });
    if (!global.consolePanelStack) {
      init(global, false);
    }
    console.log('constructor ConsoleView');

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._onStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._onMoveShouldSetPanResponder,
      onPanResponderGrant: this._onPanResponderGrant,
      onPanResponderMove: this._onPanResponderMove,
      onPanResponderRelease: this._onPanResponderEnd,
      onPanResponderTerminate: this._onPanResponderEnd,
    });
  }

  componentDidMount() {
    console.log('componentDidMount ConsoleView');
    consolePanelStack.bindUpdateListener(() => {
      this.setState({
        dataSource: consolePanelStack.getData(100),
        unreadCount: consolePanelStack.getUnreadCount(),
      });
    });
    this.panelStyle.left =
      this.panel.props && this.panel.props.style[1] ? this.panel.props.style[1].left : 10;
    this.panelStyle.top =
      this.panel.props && this.panel.props.style[1] ? this.panel.props.style[1].top : 10;
  }

  _pickStyle = level => {
    switch (level) {
      case 'warn':
        return styles.warn;
      case 'error':
        return styles.error;
      case 'info':
        return styles.info;
      case 'log':
        return styles.log;
      default:
        return null;
    }
  };
  _panResponder = {};
  panel = null;
  panelStyle = { left: 0, top: 0 };
  _onStartShouldSetPanResponder = (evt, gestureState) => true;
  _onMoveShouldSetPanResponder = () => true;
  _onPanResponderGrant = (evt, gestureState) => {
    this.panel.setNativeProps({ style: { backgroundColor: PANEL_BACKGROUND_SELECTED } });
  };
  _onPanResponderMove = (evt, gestureState) => {
    this.panel.setNativeProps({
      style: {
        left: this.panelStyle.left + gestureState.dx,
        top: this.panelStyle.top + gestureState.dy,
      },
    });
  };
  _resetPosition = () => {
    this.panelStyle.left = 0;
    this.panelStyle.top = 0;
    this.panel.setNativeProps({ style: { left: 0, top: 0 } });
  };
  _onPanResponderEnd = (evt, gestureState) => {
    this.panelStyle.left += gestureState.dx;
    this.panelStyle.top += gestureState.dy;
    this.panel.setNativeProps({ style: { backgroundColor: PANEL_BACKGROUND } });
  };
  _clearAll = () => {
    consolePanelStack.clear();
    if (this.panelStyle.left < 0 || this.panelStyle.top < 0) {
      this._resetPosition();
    }
  };

  resetCount = () =>
    this.setState({
      unreadCount: 0,
    });

  onToggleShow = () => {
    consolePanelStack.enableUnreadCount(this.state.isOpen);
    consolePanelStack.resetUnreadCount();
    this.setState(prevState => ({
      isOpen: !prevState.isOpen,
      unreadCount: 0,
    }));
  };
  render() {
    const { style } = this.props;
    console.log('Render ConsoleView');
    const content = [];
    if (this.state.isOpen) {
      this.state.dataSource.forEach((row, i) => {
        content.push(
          <Text key={i} style={[this._pickStyle(row.level), styles.contentText]}>
            {row.text}
          </Text>,
        );
      });
      if (this.state.dataSource.length < 3) {
        content.push(
          <Text key={-1} style={[styles.log, styles.contentText]}>
            {String('\n'.repeat(3 - this.state.dataSource.length))}
          </Text>,
        );
      }
    }
    return (
      <View ref={ref => (this.panel = ref)} style={[styles.container, style]}>
        {this.state.isOpen ? (
          <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
        ) : null}

        <View style={styles.bar}>
          <View style={styles.buttonContainer}>
            <Text onPress={this.resetCount} style={styles.barText}>
              Console{this.state.unreadCount > 0 ? '(' + this.state.unreadCount + ')' : null}
            </Text>
            <TouchableWithoutFeedback onPress={this._clearAll}>
              <Text style={styles.bottomBarBtnText}>clear</Text>
            </TouchableWithoutFeedback>
            <View style={styles.touchOverlay} {...this._panResponder.panHandlers}>
              <Text style={styles.posText}>{'Click and drag\n for Position'}</Text>
            </View>
          </View>
          <View style={styles.btn}>
            <TouchableWithoutFeedback onPress={this.onToggleShow}>
              <Text style={styles.barText}>{this.state.isOpen ? 'HIDE' : ' SHOW'}</Text>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </View>
    );
  }
}
const init = (_global, _keepYellowBox) => {
  (function (global, keepYellowBox) {
    const ConsoleStack = function (limit) {
      this.limit = limit;
      this.data = [];
      this.listeners = [];
      this.waiting = false;
      this.unreadEnabled = false;
      this.unreadCount = 0;
    };

    ConsoleStack.prototype.clear = function () {
      this.data.splice(0, this.data.length);
      this.notifyListeners();
    };

    ConsoleStack.prototype.notifyListeners = function () {
      if (this.waiting) {
        return;
      }
      this.timeout = setTimeout(() => {
        this.listeners.forEach(callback => {
          callback();
          clearTimeout(this.timeout);
          this.waiting = false;
        });
      }, 500);
      this.waiting = true;
    };

    ConsoleStack.prototype.add = function (type, obj) {
      const raw =
        timestamp() +
        '(' +
        type.substr(0, 1).toUpperCase() +
        '):' +
        limitString(formatToString(obj), 25, 500);
      if (this.data.unshift({ level: type, text: raw }) > this.limit) {
        this.data.pop;
      }
      this.notifyListeners();
      if (this.unreadEnabled) {
        this.unreadCount++;
      }
    };

    ConsoleStack.prototype.toString = function () {
      return formatToString(this.data);
    };

    ConsoleStack.prototype.getData = function (limit) {
      return this.data.slice(0, limit);
    };

    ConsoleStack.prototype.bindUpdateListener = function (callback) {
      this.listeners.push(callback);
    };

    ConsoleStack.prototype.getUnreadCount = function () {
      return this.unreadCount;
    };

    ConsoleStack.prototype.enableUnreadCount = function (enable) {
      this.unreadEnabled = enable;
    };

    ConsoleStack.prototype.resetUnreadCount = function () {
      this.unreadCount = 0;
    };

    function proxyStockConsole(console, consoleStack, keepYellow) {
      if (keepYellow === false) {
        LogBox.ignoreAllLogs();
      }

      const methods = ['log', 'error', 'warn', 'info'];
      methods.forEach(method => {
        const f = console[method];
        console['_' + method] = f;
        console[method] = function () {
          consoleStack.add(method, arguments[0]);
          f.apply(console, arguments);
        };
      });
    }

    if (!global.consolePanelStack) {
      const consolePanelStack = new ConsoleStack(this.state.limit);
      global.consolePanelStack = consolePanelStack;
      proxyStockConsole(global.console, consolePanelStack, keepYellowBox);
    }
  })(_global, _keepYellowBox);
};

const limitString = (input, lineLimit, charLimit) => {
  let changed = input.length > charLimit;
  input = input.substr(0, charLimit);
  const lines = input.split('\n');
  if (lines.length > lineLimit) {
    changed = true;
    lines.splice(lineLimit, lines.length - lineLimit);
  }
  const newContent = lines.join('\n');
  return newContent + (changed ? '...' : '');
};

const formatToString = obj => {
  if (
    obj === null ||
    obj === undefined ||
    typeof obj === 'string' ||
    typeof obj === 'number' ||
    typeof obj === 'boolean' ||
    typeof obj === 'function'
  ) {
    return '"' + String(obj) + '"';
  } else if (obj instanceof Date) {
    return 'Date(' + obj.toISOString() + ')';
  } else if (Array.isArray(obj)) {
    return 'Array(' + obj.length + ')[' + obj.map(elem => formatToString(elem)) + ']';
  } else if (obj instanceof Object) {
    return 'object: ' + JSON.stringify(obj);
  } else {
    return 'unknown data';
  }
};

const formatter = len => {
  return input => {
    const str = String(input);
    const strLen = str.length;
    return '0'.repeat(len - strLen) + input;
  };
};

const timestamp = () => {
  const d = new Date();
  const f2 = formatter(2);
  return (
    f2(d.getHours()) +
    ':' +
    f2(d.getMinutes()) +
    ':' +
    f2(d.getSeconds()) +
    '.' +
    formatter(3)(d.getMilliseconds())
  );
};

const PANEL_BACKGROUND = 'rgba(51,72,94,0.9)';
const PANEL_BACKGROUND_SELECTED = 'rgba(51,72,94,0.95)';
const HEIGHT_BAR = 30;
const COLOR = {
  Green: 'green',
  BarBG: 'rgba(128,128,128,0.9)',
  White: 'white',
  Black: 'black',
  Tranparent: 'transparent',
  Lime: 'lime',
  Warn: '#ffdab9',
  Error: 'tomato',
};

const styles = StyleSheet.create({
  container: {
    top: 23,
    minHeight: HEIGHT_BAR,
    left: 0,
    right: 0,
    borderWidth: 1,
    width: Dimensions.get('window').width,
    position: 'absolute',
    maxHeight: 250,
    overflow: 'hidden',
    backgroundColor: PANEL_BACKGROUND,
  },
  posText: {
    fontSize: 9,
    textAlign: 'center',
  },
  bar: {
    backgroundColor: COLOR.BarBG,
    paddingVertical: 4,
    paddingLeft: 16,
    height: HEIGHT_BAR,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barText: {
    fontSize: 12,
    color: COLOR.White,
    marginLeft: 6,
  },
  bottomBarBtnText: {
    color: COLOR.White,
    fontSize: 12,
    fontWeight: 'bold',
  },
  btn: {
    padding: 5,
    height: HEIGHT_BAR,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.Black,
  },
  content: {
    padding: 2,
    paddingBottom: 37,
  },
  contentText: {
    fontSize: 10,
  },
  log: {
    color: COLOR.Lime,
  },
  info: {
    color: COLOR.White,
  },
  warn: {
    color: COLOR.Warn,
  },
  error: {
    color: COLOR.Error,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  touchOverlay: {
    height: HEIGHT_BAR,
    width: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.Tranparent,
  },
});

const ConsoleView = props => {
  init(window, false);
  return <ConsolePanel {...props} />;
};

export default ConsoleView;
