import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Change to local IP during dev

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'partner';
}

export default function ChatScreen() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  // Tone Check State
  const [showToneModal, setShowToneModal] = useState(false);
  const [toneSuggestions, setToneSuggestions] = useState<string[]>([]);
  const [toneAnalysis, setToneAnalysis] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    newSocket.emit('join_room', { coupleId: 'couple_123', userId: 'user_1' });

    newSocket.on('partner_typing', (payload) => {
      setPartnerTyping(payload.isTyping);
    });

    return () => { newSocket.close(); };
  }, []);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      socket?.emit('typing_start');
    } else if (text.length === 0) {
      setIsTyping(false);
      socket?.emit('typing_end');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // AI Tone Check integration
    // Only check messages longer than a few words to avoid checking "ok"
    if (inputText.split(' ').length > 3) {
      try {
        // In a real app, use your deployed Next.js backend URL
        const response = await fetch('http://localhost:3000/api/tone-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: inputText, partnerName: 'Reeya' })
        });
        
        const result = await response.json();
        
        if (result.isFlagged) {
          setToneAnalysis(result.analysis);
          setToneSuggestions(result.suggestions);
          setShowToneModal(true);
          return; // Stop sending, show modal
        }
      } catch (error) {
        console.error("Tone check failed, sending anyway", error);
      }
    }

    sendMessage(inputText);
  };

  const sendMessage = (text: string) => {
    const newMessage: Message = { id: Date.now().toString(), text, sender: 'me' };
    setMessages([...messages, newMessage]);
    setInputText('');
    setIsTyping(false);
    socket?.emit('typing_end');
    setShowToneModal(false);
    
    // Here you would also emit the message via socket or save to Prisma via REST API
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Message }) => (
          <View style={[styles.messageBubble, item.sender === 'me' ? styles.myMessage : styles.partnerMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />
      
      {partnerTyping && <Text style={styles.typingIndicator}>Partner is typing...</Text>}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <Button title="Send" onPress={handleSend} color="#FF69B4" />
      </View>

      {/* Tone Check Modal */}
      <Modal visible={showToneModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tone Check 🕊️</Text>
            <Text style={styles.modalAnalysis}>{toneAnalysis}</Text>
            
            <Text style={styles.modalSubtitle}>Consider rewriting as:</Text>
            {toneSuggestions.map((suggestion: string, index: number) => (
              <View key={index}>
                <TouchableOpacity style={styles.suggestionBtn} onPress={() => setInputText(suggestion)}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.modalActions}>
              <Button title="Send Anyway" onPress={() => sendMessage(inputText)} color="#999" />
              <Button title="Edit Message" onPress={() => setShowToneModal(false)} color="#FF69B4" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 10 },
  messageBubble: { padding: 12, borderRadius: 16, marginVertical: 4, maxWidth: '80%' },
  myMessage: { backgroundColor: '#FF69B4', alignSelf: 'flex-end' },
  partnerMessage: { backgroundColor: '#333', alignSelf: 'flex-start' },
  messageText: { color: '#FFF', fontSize: 16 },
  typingIndicator: { color: '#888', fontStyle: 'italic', marginBottom: 8, paddingLeft: 8 },
  inputContainer: { flexDirection: 'row', padding: 8, backgroundColor: '#1E1E1E', borderRadius: 24, alignItems: 'center' },
  input: { flex: 1, color: '#FFF', paddingHorizontal: 16, fontSize: 16 },
  
  // Modal styles
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1E1E1E', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  modalAnalysis: { color: '#FFB6C1', fontSize: 16, marginBottom: 16 },
  modalSubtitle: { color: '#CCC', fontSize: 14, marginBottom: 8 },
  suggestionBtn: { backgroundColor: '#333', padding: 12, borderRadius: 12, marginBottom: 8 },
  suggestionText: { color: '#FFF', fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }
});
