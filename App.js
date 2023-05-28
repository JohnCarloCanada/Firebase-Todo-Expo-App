import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Button,
} from "react-native";

import Task from "./src/components/Task";
import react, { useState, useEffect, useRef } from "react";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [task, setTask] = useState("");
  const [taskItems, setTaskItems] = useState([{ id: 1, task: "HEHE", completed: true }]);
  const [date, setDate] = useState(new Date(1598051730000));
  /*   const [triggerTime, setTriggerTime] = useState(null); */

  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  const { container, taskWrapper, sectionTitle, item, writeTaskWrapper, input, addWrapper, addText, buttonViewWrapper } = styles;

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const handleAddTask = async () => {
    Keyboard.dismiss();
    if (!task) return null;
    let currentDate = new Date();
    let specificDate = new Date(date);

    const timeDiff = specificDate - currentDate;

    const remainingMinutes = Math.floor(timeDiff / (1000 * 60));

    const remainingSeconds = remainingMinutes * 60 + (timeDiff % 60000) / 1000;

    const id = taskItems.length ? taskItems[taskItems.length - 1].id + 1 : 1;
    const newTaskItem = { id, task, completed: false, triggerTime: Math.round(remainingSeconds) };

    setTaskItems((prevState) => [...prevState, newTaskItem]);
    setTask("");
    await schedulePushNotification(newTaskItem.triggerTime, newTaskItem.task);
  };

  const completeTask = (id) => {
    const newTaskItem = taskItems.filter((tasks) => tasks.id !== id);
    setTaskItems(newTaskItem);
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate;
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    DateTimePickerAndroid.open({
      value: date,
      onChange,
      mode: currentMode,
      is24Hour: true,
    });
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };

  return (
    <SafeAreaView style={container}>
      <StatusBar />
      <View style={taskWrapper}>
        <Text style={sectionTitle}>Task Master</Text>

        <View style={item}>
          {taskItems.map((tasks) => (
            <TouchableOpacity key={tasks.id} onPress={() => completeTask(tasks.id)}>
              <Task {...tasks} />
            </TouchableOpacity>
          ))}
        </View>

        <KeyboardAvoidingView style={writeTaskWrapper} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TextInput style={input} placeholder="Write A Task" value={task} onChangeText={(text) => setTask(text)} />
          <TouchableOpacity onPress={handleAddTask}>
            <View style={addWrapper}>
              <Text style={addText}>+</Text>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
        <View style={{ marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 20 }}>
          <View style={buttonViewWrapper}>
            <Button onPress={showDatepicker} title="Date" />
          </View>
          <View style={buttonViewWrapper}>
            <Button onPress={showTimepicker} title="Time" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
async function schedulePushNotification(time, bodyText) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Task Master! 📬",
      body: bodyText,
      data: { data: "goes here" },
    },
    trigger: { seconds: time },
  });
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8EAED",
  },
  taskWrapper: {
    paddingTop: 80,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  item: {
    marginTop: 30,
  },
  writeTaskWrapper: {
    paddingTop: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    width: 250,
    backgroundColor: "white",
    borderRadius: 60,
    borderWidth: 1,
  },
  addWrapper: {
    width: 60,
    height: 60,
    backgroundColor: "white",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonViewWrapper: {
    width: "50%",
  },
  addText: {},
});
