import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Change to local IP during dev

export default function ThumbkissScreen() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isPartnerTouching, setIsPartnerTouching] = useState(false);
  const partnerTouchPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const myTouchPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Mock couple ID for dev
    newSocket.emit('join_room', { coupleId: 'couple_123', userId: 'user_1' });

    newSocket.on('partner_touch_start', (payload) => {
      setIsPartnerTouching(true);
      partnerTouchPos.setValue({ x: payload.x, y: payload.y });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });

    newSocket.on('partner_touch_move', (payload) => {
      partnerTouchPos.setValue({ x: payload.x, y: payload.y });
    });

    newSocket.on('partner_touch_end', () => {
      setIsPartnerTouching(false);
    });

    return () => { newSocket.close(); };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        myTouchPos.setValue({ x: locationX, y: locationY });
        socket?.emit('touch_start', { x: locationX, y: locationY });
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        myTouchPos.setValue({ x: locationX, y: locationY });
        socket?.emit('touch_move', { x: locationX, y: locationY });
        
        // Local distance calculation for haptics
        // In a full app, we sync this perfectly with the partner via server
        if (isPartnerTouching) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      onPanResponderRelease: () => {
        socket?.emit('touch_end');
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.text}>Touch the screen to connect...</Text>
      
      {isPartnerTouching && (
        <Animated.View
          style={[
            styles.partnerFinger,
            { transform: partnerTouchPos.getTranslateTransform() }
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    opacity: 0.5,
  },
  partnerFinger: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 105, 180, 0.4)', // Pink glowing circle
    borderWidth: 2,
    borderColor: '#FF69B4',
    marginLeft: -30, // Center the circle on the finger
    marginTop: -30,
  },
});
