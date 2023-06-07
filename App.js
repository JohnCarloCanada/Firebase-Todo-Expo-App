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
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

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
  const [taskItems, setTaskItems] = useState([
    { id: 1, task: "Cook the Cockcroach", completed: true },
  ]);
  const [date, setDate] = useState(new Date(1598051730000));

  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  const {
    container,
    taskWrapper,
    sectionTitle,
    item,
    writeTaskWrapper,
    input,
    addWrapper,
    addText,
    buttonViewWrapper,
  } = styles;

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  /**
   * The function adds a new task item to a list and schedules a push notification for the task.
   * @returns If the `task` variable is falsy (e.g. empty string, null, undefined), then `null` is
   * being returned. Otherwise, nothing is being returned explicitly, but the function is adding a new
   * task item to the `taskItems` state array and scheduling a push notification for the specified
   * trigger time.
   */
  const handleAddTask = async () => {
    Keyboard.dismiss();
    if (!task) return null;
    let currentDate = new Date();
    let specificDate = new Date(date);

    const timeDiff = specificDate - currentDate;

    const remainingMinutes = Math.floor(timeDiff / (1000 * 60));

    const remainingSeconds = remainingMinutes * 60 + (timeDiff % 60000) / 1000;

    const id = taskItems.length ? taskItems[taskItems.length - 1].id + 1 : 1;
    const newTaskItem = {
      id,
      task,
      completed: false,
      triggerTime: Math.round(remainingSeconds),
    };

    setTaskItems((prevState) => [...prevState, newTaskItem]);
    setTask("");
    await schedulePushNotification(newTaskItem.triggerTime, newTaskItem.task);
  };

  /**
   * The function removes a task item from an array of task items based on its ID.
   * @param id - The `id` parameter is a unique identifier for a task item that needs to be completed.
   * The `completeTask` function uses this `id` to filter out the task item from the `taskItems` array
   * and update the state using the `setTaskItems` function.
   */
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
      is24Hour: false,
    });
  };

  const showPicker = (val) => {
    showMode(val);
  };

  return (
    <SafeAreaView style={container}>
      <StatusBar />
      <KeyboardAvoidingView
        style={writeTaskWrapper}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TextInput
          style={input}
          placeholder="Write A Task"
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity onPress={handleAddTask}>
          <View style={addWrapper}>
            <Text style={addText}>+</Text>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      <View
        style={{
          marginTop: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 20,
        }}
      >
        <View style={buttonViewWrapper}>
          <Button onPress={() => showPicker("date")} title="Date" />
        </View>
        <View style={buttonViewWrapper}>
          <Button onPress={() => showPicker("time")} title="Time" />
        </View>
      </View>
      <View style={taskWrapper}>
        <Text style={sectionTitle}>Task Master</Text>
        <View style={item}>
          {taskItems.map((tasks) => (
            <Task key={tasks.id} tasks={tasks} completeTask={completeTask} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * This function schedules a push notification with a specified body text and time delay using the
 * Notifications API in JavaScript.
 * @param time - The time parameter is the number of seconds after which the push notification should
 * be scheduled.
 * @param bodyText - The text that will be displayed as the body of the push notification. It can be
 * customized to provide information or instructions to the user.
 */
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

/**
 * This function registers a device for push notifications and returns the device's push token.
 * @returns the Expo push token obtained from the device, which is a unique identifier for the device
 * that can be used to send push notifications to it. If the function fails to obtain the token, it
 * will return undefined.
 */
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
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
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
    width: "40%",
  },
  addText: {},
});
