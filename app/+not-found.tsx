import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View, Image } from "react-native";
import colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Image
          source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
          style={styles.totie}
          resizeMode="contain"
        />
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  totie: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: colors.text,
    marginBottom: 8,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.primary,
  },
});
