import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import TextRecognition from 'react-native-text-recognition';
import {
  Camera,
  CameraPermissionRequestResult,
  useCameraDevices,
} from 'react-native-vision-camera';
import {Capture} from './assets/icons';

const findCardNumberInArray: (arr: string[]) => string = arr => {
  let creditCardNumber = '';
  arr.forEach(e => {
    let numericValues = e.replace(/\D/g, '');
    const creditCardRegex =
      /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;
    if (creditCardRegex.test(numericValues)) {
      creditCardNumber = numericValues;
      return;
    }
  });
  return creditCardNumber;
};

const getFormattedCreditCardNumber: (cardNo: string) => string = cardNo => {
  let formattedCardNo = '';
  for (let i = 0; i < cardNo?.length; i++) {
    if (i % 4 === 0 && i !== 0) {
      formattedCardNo += ` • ${cardNo?.[i]}`;
      continue;
    }
    formattedCardNo += cardNo?.[i];
  }
  return formattedCardNo;
};

export const App: React.FC = () => {
  const [processedText, setProcessedText] = React.useState<string>(
    'Scan a Card to see\nCard Number here',
  );
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  let device: any = devices.back;
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [isProcessingText, setIsProcessingText] = useState<boolean>(false);
  const [cardIsFound, setCardIsFound] = useState<boolean>(false);

  const validateCard: (result: string[]) => void = result => {
    const cardNumber = findCardNumberInArray(result);
    if (cardNumber?.length) {
      setProcessedText(cardNumber);
      setCardIsFound(true);
    } else {
      setProcessedText('No valid Credit Card found, please try again!!');
      setCardIsFound(false);
    }
  };

  const pickAndRecognize: () => void = useCallback(async () => {
    ImagePicker.openPicker({
      cropping: false,
    })
      .then(async (res: ImageOrVideo) => {
        setIsProcessingText(true);
        const result: string[] = await TextRecognition.recognize(res?.path);
        setIsProcessingText(false);
        validateCard(result);
      })
      .catch(err => {
        console.log('err:', err);
        setIsProcessingText(false);
      });
  }, []);

  const captureAndRecognize = useCallback(async () => {
    try {
      const image = await camera.current?.takePhoto({
        qualityPrioritization: 'quality',
        enableAutoStabilization: true,
        flash: 'on',
        skipMetadata: true,
      });
      setIsProcessingText(true);
      const result: string[] = await TextRecognition.recognize(
        image?.path as string,
      );
      setIsProcessingText(false);
      validateCard(result);
    } catch (err) {
      console.log('err:', err);
      setIsProcessingText(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const cameraPermission: CameraPermissionRequestResult =
        await Camera.requestCameraPermission();
      const microPhonePermission: CameraPermissionRequestResult =
        await Camera.requestMicrophonePermission();
      if (cameraPermission === 'denied' || microPhonePermission === 'denied') {
        Alert.alert(
          'Allow Permissions',
          'Please allow camera and microphone permission to access camera features',
          [
            {
              text: 'Go to Settings',
              onPress: () => Linking.openSettings(),
            },
            {
              text: 'Cancel',
            },
          ],
        );
        setHasPermissions(false);
      } else {
        setHasPermissions(true);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <Text style={styles.title}>Credit Card Scanner</Text>
      <Pressable style={styles.galleryBtn} onPress={pickAndRecognize}>
        <Text style={styles.btnText}>Pick from Gallery</Text>
      </Pressable>
      {device && hasPermissions ? (
        <View>
          <Camera
            photo
            enableHighQualityPhotos
            ref={camera}
            style={styles.camera}
            isActive={true}
            device={device}
          />
          <Pressable
            style={styles.captureBtnContainer}
            onPress={captureAndRecognize}>
            <Image source={Capture} />
          </Pressable>
        </View>
      ) : (
        <Text>No Camera Found</Text>
      )}
      {isProcessingText ? (
        <ActivityIndicator
          size={'large'}
          style={styles.activityIndicator}
          color={'blue'}
        />
      ) : cardIsFound ? (
        <Text style={styles.creditCardNo}>
          {getFormattedCreditCardNumber(processedText)}
        </Text>
      ) : (
        <Text style={styles.errorText}>{processedText}</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  camera: {
    marginVertical: 24,
    height: 240,
    width: 360,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.6,
    marginTop: 18,
  },
  galleryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#000',
    borderRadius: 40,
    marginTop: 18,
  },
  btnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  errorText: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'purple',
    textAlign: 'center',
    alignSelf: 'center',
  },
  captureBtnContainer: {
    position: 'absolute',
    bottom: 28,
    right: 10,
  },
  activityIndicator: {
    marginTop: 34,
  },
  creditCardNo: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: 'blue',
    marginTop: 40,
    textAlign: 'center',
    alignSelf: 'center',
  },
});
