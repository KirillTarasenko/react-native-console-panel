# This is fork NativeSH/react-native-console-panel
Main changes: UI, Using as Component and modern code. Concept based on main repository.

# React Native Console Panel  
A Simple debug panel component to view console message right inside the app.  
This will be helpful during your react native development.
This is a pure react native component ,you can use it in both ios and android .

**Xcode / Android Studio is not a must for React Native app development.**  
RN developers can simplify tool chain with this component when coding javascript only.  
You don't have to open any of Xcode , Android Studio or Chrome dev console for viewing js console message. A javascript editor and a emulator/device are all you need.

## Usage
### Install from npm :  
`npm install --save KirillTarasenko/react-native-console-panel`

### Integrate into your app:  

```javascript
//import the component
import ConsolePanel from 'react-native-console-panel';

...
render(){
	return (
		<View style={styles.container}>
        	...
        	<TouchableHighlight style={styles.btn} onPress={this._onPressButton}>
          	<Text>
            Hit me!
          	</Text>
			</TouchableHighlight>
			
			
        	{__DEV__ ? <ConsolePanel style={{ maxHeight: 500 }} /> : null}
      </View>
      );
```

### How it look?
<img width="309" alt="Снимок экрана 2021-03-07 в 12 32 20" src="https://user-images.githubusercontent.com/18124381/110235805-1cf09f80-7f43-11eb-914a-6c3a4cd9782c.png">
<img width="302" alt="Снимок экрана 2021-03-07 в 12 32 38" src="https://user-images.githubusercontent.com/18124381/110235812-21b55380-7f43-11eb-9658-e3c29aa93e21.png">


### Avaiable props:

```javascript
	propTypes:{
		open: PropTypes.bool,//is open when mounted
		style: PropTypes.object,//style ConsoleView container
    }
```

### Why dont work on production?
Maybe you use babel-plugin-transform-remove-console ?)

**Waiting your PR!**
