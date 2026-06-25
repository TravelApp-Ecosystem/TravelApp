import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Image, Linking, Alert, Modal, Switch, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Colors, TRAVIS_WEBHOOK_URL } from '../lib/constants';
import { TravelAppLogo } from '../components/BrandLogos';

const { width } = Dimensions.get('window');

interface PassengerDossier {
  uid: string;
  name: string;
  email: string;
  passport: string;
  emergencyContact: string;
  medicalNotes: string;
  hasPurchasedOrganizedTrip: boolean;
  tripId: string;
  paymentPaid: number;
  paymentTotal: number;
}

export default function CoordinatorHomeScreen() {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser!;
  const coordinatorName = user?.displayName || 'Marcos Vignola';

  // Navegación de Tabs Internos: 'trips' | 'passengers' | 'excursions' | 'chat'
  const [activeTab, setActiveTab] = useState<'trips' | 'passengers' | 'excursions' | 'chat'>('trips');

  // Estados de datos
  const [loading, setLoading] = useState(true);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [passengersList, setPassengersList] = useState<PassengerDossier[]>([]);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [coordMessageText, setCoordMessageText] = useState('');
  const [checkedServices, setCheckedServices] = useState<{ [key: string]: boolean }>({});

  // Rooming list & Boarding controls
  const [roomingModalVisible, setRoomingModalVisible] = useState(false);
  const [boardingModalVisible, setBoardingModalVisible] = useState(false);
  const [boardingStatus, setBoardingStatus] = useState<{ [key: string]: boolean }>({});
  const [sendAsAlert, setSendAsAlert] = useState(false);
  const [simulatedQrInput, setSimulatedQrInput] = useState('');

  // Cargar todos los viajes grupales activos en Firestore
  useEffect(() => {
    const q = query(collection(db, 'contracted_trips'));
    const unsub = onSnapshot(q, async (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setActiveTrips(list);
      
      if (list.length > 0) {
        // Seleccionar el primero por defecto
        const defaultTrip = list[0];
        setSelectedTrip(defaultTrip);
      } else {
        setSelectedTrip(null);
        setLoading(false);
      }
    }, (err) => {
      console.log("Error loading contracted trips:", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Cargar detalles de pasajeros y mensajes de grupo una vez seleccionado el viaje
  useEffect(() => {
    if (selectedTrip) {
      setLoading(true);
      
      // 1. Obtener la información de los usuarios registrados para este viaje
      const unsubPassengers = onSnapshot(
        query(collection(db, 'users'), where('hasPurchasedOrganizedTrip', '==', true)),
        (userSnap) => {
          const passengers: PassengerDossier[] = [];
          userSnap.forEach((userDoc) => {
            const userData = userDoc.data();
            passengers.push({
              uid: userDoc.id,
              name: userData.displayName || 'Pasajero',
              email: userData.email || '',
              passport: userData.passport || 'No completado',
              emergencyContact: userData.emergencyContact || 'No completado',
              medicalNotes: userData.medicalNotes || 'Ninguna',
              hasPurchasedOrganizedTrip: !!userData.hasPurchasedOrganizedTrip,
              tripId: selectedTrip.id,
              paymentPaid: selectedTrip.payment?.paidAmount || 0,
              paymentTotal: selectedTrip.payment?.totalAmount || 0,
            });
          });
          setPassengersList(passengers);
          setLoading(false);
        }
      );

      // 2. Escuchar el chat grupal del viaje seleccionado en tiempo real
      const unsubMessages = onSnapshot(
        collection(db, 'contracted_trips', selectedTrip.id, 'group_messages'),
        (msgSnap) => {
          const msgs = msgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
          setGroupMessages(msgs);
        }
      );

      // 3. Escuchar el estado de abordaje del autobús en tiempo real
      const unsubBoarding = onSnapshot(
        collection(db, 'contracted_trips', selectedTrip.id, 'boarding_status'),
        (boardingSnap) => {
          const statusMap: { [key: string]: boolean } = {};
          boardingSnap.forEach(d => {
            statusMap[d.id] = !!d.data().boarded;
          });
          setBoardingStatus(statusMap);
        }
      );

      return () => {
        unsubPassengers();
        unsubMessages();
        unsubBoarding();
      };
    } else {
      setPassengersList([]);
      setGroupMessages([]);
      setBoardingStatus({});
      setLoading(false);
    }
  }, [selectedTrip?.id]);

  // Enviar mensaje al grupo como Coordinador
  const handleSendGroupMessage = async () => {
    const text = coordMessageText.trim();
    if (!text || !selectedTrip) return;
    try {
      const msgRef = doc(collection(db, 'contracted_trips', selectedTrip.id, 'group_messages'), `msg_${Date.now()}`);
      await setDoc(msgRef, {
        sender: coordinatorName,
        senderRole: 'coordinador',
        text: text,
        type: sendAsAlert ? 'alert' : 'message',
        timestamp: Date.now()
      });
      setCoordMessageText('');
      setSendAsAlert(false);
    } catch (err) {
      console.log("Error sending group message:", err);
    }
  };

  // Registrar pago manual en efectivo de una excursión opcional
  const handleToggleExcursionPaymentManual = async (passengerUid: string, excursionId: string, isPaid: boolean) => {
    if (!selectedTrip) return;
    try {
      const tripRef = doc(db, 'contracted_trips', selectedTrip.id);
      
      const updatedExcursions = selectedTrip.optionalExcursions.map((exc: any) => {
        if (exc.id === excursionId) {
          return { ...exc, paid: !isPaid };
        }
        return exc;
      });

      const excursionCost = selectedTrip.optionalExcursions.find((e: any) => e.id === excursionId)?.price || 0;
      const newPaidAmount = selectedTrip.payment.paidAmount + (isPaid ? -excursionCost : excursionCost);

      // Actualizar el documento de viaje contratado
      await updateDoc(tripRef, {
        optionalExcursions: updatedExcursions,
        'payment.paidAmount': newPaidAmount
      });

      // Asignar o descontar puntos de Rewards al pasajero (1 punto por USD gastado)
      const userRef = doc(db, 'users', passengerUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentPoints = userSnap.data().rewardsPoints || 0;
        const pointsDiff = isPaid ? -excursionCost : excursionCost;
        await updateDoc(userRef, {
          rewardsPoints: Math.max(0, currentPoints + pointsDiff)
        });
      }

      setSelectedTrip((prev: any) => ({
        ...prev,
        optionalExcursions: updatedExcursions,
        payment: {
          ...prev.payment,
          paidAmount: newPaidAmount
        }
      }));

      Alert.alert(
        'Pago Registrado',
        `El estado de la excursión fue actualizado a ${!isPaid ? 'PAGADO (Se asignaron puntos)' : 'PENDIENTE (Se descontaron puntos)'} en el sistema.`
      );
    } catch (err) {
      console.log("Error updating excursion payment:", err);
      Alert.alert('Error', 'No se pudo actualizar el estado de pago.');
    }
  };

  const handleToggleService = (service: string) => {
    setCheckedServices(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  // Cambiar estado de abordaje manualmente
  const handleToggleBoarding = async (passengerUid: string, currentStatus: boolean) => {
    if (!selectedTrip) return;
    try {
      await setDoc(doc(db, 'contracted_trips', selectedTrip.id, 'boarding_status', passengerUid), {
        boarded: !currentStatus,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'No se pudo actualizar el estado de abordaje.');
    }
  };

  // Simular escaneo de código QR check-in del pasajero
  const handleSimulateQrScan = async () => {
    const input = simulatedQrInput.trim();
    if (!input || !selectedTrip) return;
    
    if (input.startsWith('trip_checkin:')) {
      const parts = input.split(':');
      const passengerUid = parts[1];
      
      const passenger = passengersList.find(p => p.uid === passengerUid);
      if (passenger) {
        try {
          await setDoc(doc(db, 'contracted_trips', selectedTrip.id, 'boarding_status', passengerUid), {
            boarded: true,
            updatedAt: Timestamp.now()
          });
          Alert.alert('¡Check-in Exitoso! ✅', `El pasajero ${passenger.name} abordó correctamente el micro.`);
          setSimulatedQrInput('');
        } catch (err) {
          Alert.alert('Error', 'No se pudo registrar el abordaje.');
        }
      } else {
        Alert.alert('Error de Escaneo', 'El pasajero escaneado no pertenece a este viaje.');
      }
    } else {
      Alert.alert('Código Inválido', 'El formato del código QR no es válido para control de abordaje.');
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER DE COORDINADOR */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 40 }]}>
        <View style={styles.headerRow}>
          <TravelAppLogo size={28} textColor={Colors.white} isAccentColor={false} />
          <View>
            <Text style={styles.headerTitle}>Panel de Coordinación</Text>
            <Text style={styles.headerSubtitle}>Coordinador: {coordinatorName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => auth.signOut()}>
          <Ionicons name="log-out-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* SELECTOR DE VIAJE ACTIVO */}
      <View style={styles.tripSelectorCard}>
        <Text style={styles.label}>Seleccionar Viaje Asignado:</Text>
        {activeTrips.length === 0 ? (
          <Text style={styles.noTripsText}>No tenés viajes asignados en este momento.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripsScroll}>
            {activeTrips.map((t) => {
              const isSel = selectedTrip?.id === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tripOptionBtn, isSel && styles.tripOptionBtnActive]}
                  onPress={() => setSelectedTrip(t)}
                >
                  <Ionicons name="compass" size={14} color={isSel ? Colors.white : Colors.primary} />
                  <Text style={[styles.tripOptionText, isSel && styles.tripOptionTextActive]}>
                    {t.destination}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando datos del viaje...</Text>
        </View>
      ) : selectedTrip ? (
        <View style={{ flex: 1 }}>
          {/* BOTONES DE PESTAÑAS */}
          <View style={styles.tabsRow}>
            {[
              { id: 'trips', label: 'Mi Viaje', icon: 'map-outline' },
              { id: 'passengers', label: 'Pasajeros', icon: 'people-outline' },
              { id: 'excursions', label: 'Excursiones', icon: 'cash-outline' },
              { id: 'chat', label: 'Chat Grupal', icon: 'chatbubbles-outline' },
            ].map((tab) => {
              const isSel = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtn, isSel && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id as any)}
                >
                  <Ionicons name={tab.icon as any} size={18} color={isSel ? Colors.accent : '#94A3B8'} />
                  <Text style={[styles.tabLabel, isSel && styles.tabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CONTENIDO PRINCIPAL DE PESTAÑAS */}
          <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
            {/* PESTAÑA 1: MI VIAJE / SERVICIOS */}
            {activeTab === 'trips' && (
              <View style={styles.tabContent}>
                <Image source={{ uri: selectedTrip.imageUrl }} style={styles.tripImg} />
                <View style={styles.tripMetaCard}>
                  <Text style={styles.tripTitle}>{selectedTrip.destination}</Text>
                  <Text style={styles.tripDates}>📅 Fechas: {selectedTrip.dates}</Text>
                  <Text style={styles.tripRecommendations}>📝 Recomendaciones: {selectedTrip.recommendations}</Text>
                </View>

                {/* BOTONES LOGÍSTICOS DEL COORDINADOR */}
                <View style={styles.logisticsRow}>
                  <TouchableOpacity 
                    style={styles.logisticsBtn} 
                    onPress={() => setRoomingModalVisible(true)}
                  >
                    <Ionicons name="bed-outline" size={18} color={Colors.white} />
                    <Text style={styles.logisticsBtnText}>Consultar Rooming List</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.logisticsBtn, { backgroundColor: Colors.accent }]} 
                    onPress={() => setBoardingModalVisible(true)}
                  >
                    <Ionicons name="bus-outline" size={18} color={Colors.white} />
                    <Text style={styles.logisticsBtnText}>Control de Abordaje</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Checklist de Control de Servicios</Text>
                <View style={styles.servicesCard}>
                  {selectedTrip.services?.map((service: string, index: number) => {
                    const isChecked = !!checkedServices[service];
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.serviceRow}
                        onPress={() => handleToggleService(service)}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={isChecked ? Colors.success : Colors.textMuted}
                        />
                        <Text style={[styles.serviceText, isChecked && styles.serviceTextChecked]}>
                          {service}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* PESTAÑA 2: LISTADO DE PASAJEROS */}
            {activeTab === 'passengers' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Fichas de Pasajeros Registrados</Text>
                {passengersList.length === 0 ? (
                  <Text style={styles.noDataText}>No hay pasajeros registrados con pago para este viaje.</Text>
                ) : (
                  passengersList.map((passenger) => (
                    <View key={passenger.uid} style={styles.passengerCard}>
                      <View style={styles.passengerHeader}>
                        <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                        <Text style={styles.passengerName}>{passenger.name}</Text>
                      </View>
                      
                      <View style={styles.passengerDetails}>
                        <Text style={styles.detailText}>📧 **Email:** {passenger.email}</Text>
                        <Text style={styles.detailText}>🪪 **DNI / Pasaporte:** {passenger.passport}</Text>
                        <Text style={styles.detailText}>🚨 **Contacto Emergencia:** {passenger.emergencyContact}</Text>
                        <Text style={[styles.detailText, { color: Colors.danger }]}>
                          ⚠️ **Alergias / Ficha Médica:** {passenger.medicalNotes}
                        </Text>
                        <View style={styles.paymentBadgeRow}>
                          <Text style={styles.detailText}>💰 **Saldo Abonado:**</Text>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>
                              U$S {passenger.paymentPaid} / {passenger.paymentTotal}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* PESTAÑA 3: CONTROL DE EXCURSIONES */}
            {activeTab === 'excursions' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Control y Cobro de Excursiones Opcionales</Text>
                {selectedTrip.optionalExcursions?.map((exc: any) => (
                  <View key={exc.id} style={styles.excursionCard}>
                    <View style={styles.excursionHeader}>
                      <Text style={styles.excursionTitle}>{exc.title}</Text>
                      <Text style={styles.excursionPrice}>U$S {exc.price}</Text>
                    </View>
                    <Text style={styles.excursionDesc}>{exc.description}</Text>

                    <Text style={styles.excursionSub}>Listado de Pasajeros:</Text>
                    {passengersList.map((passenger) => (
                      <View key={passenger.uid} style={styles.excursionPassengerRow}>
                        <Text style={styles.excursionPassengerName}>{passenger.name}</Text>
                        
                        {exc.paid ? (
                          <View style={styles.paidBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                            <Text style={styles.paidBadgeText}>PAGADO</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.payCashBtn}
                            onPress={() => handleToggleExcursionPaymentManual(passenger.uid, exc.id, exc.paid)}
                          >
                            <Ionicons name="cash-outline" size={12} color={Colors.white} />
                            <Text style={styles.payCashBtnText}>Registrar Efectivo</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* PESTAÑA 4: CHAT GRUPAL */}
            {activeTab === 'chat' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Mensajería en Vivo con Pasajeros 💬</Text>
                <View style={styles.chatBox}>
                  <ScrollView 
                    style={styles.chatScroll}
                    contentContainerStyle={{ gap: 10, padding: 10 }}
                    nestedScrollEnabled
                  >
                    {groupMessages.map((msg) => {
                      const isMe = msg.senderRole === 'coordinador';
                      const isSystem = msg.senderRole === 'sistema';
                      return (
                        <View
                          key={msg.id}
                          style={[
                            styles.chatBubble,
                            isMe ? styles.chatBubbleMe : isSystem ? styles.chatBubbleSystem : styles.chatBubbleOther
                          ]}
                        >
                          <Text style={styles.chatSender}>{msg.sender} ({msg.senderRole})</Text>
                          <Text style={styles.chatText}>{msg.text}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.chatAlertRow}>
                    <Text style={styles.chatAlertLabel}>Enviar como Alerta Urgente ⚠️</Text>
                    <Switch
                      value={sendAsAlert}
                      onValueChange={setSendAsAlert}
                      trackColor={{ false: Colors.border, true: '#FF7A00' }}
                      thumbColor={Colors.white}
                    />
                  </View>
                  <View style={styles.chatInputRow}>
                    <TextInput
                      style={styles.chatInput}
                      placeholder={sendAsAlert ? "Escribí comunicado urgente..." : "Escribí un aviso para el grupo..."}
                      value={coordMessageText}
                      onChangeText={setCoordMessageText}
                    />
                    <TouchableOpacity style={[styles.sendBtn, sendAsAlert && { backgroundColor: '#FF7A00' }]} onPress={handleSendGroupMessage}>
                      <Ionicons name="send" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.loadingText}>No se encontraron datos del viaje.</Text>
        </View>
      )}

      {/* MODAL DE ROOMING LIST (HABITACIONES) */}
      <Modal
        visible={roomingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoomingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="bed" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Rooming List - Habitaciones</Text>
            </View>
            <Text style={styles.modalSubtitle}>Distribución y asignación de habitaciones del hotel configuradas desde el CRM Web:</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, width: '100%' }}>
              {(!selectedTrip || !selectedTrip.roomingList || selectedTrip.roomingList.length === 0) ? (
                // Fallback / Borrador
                <View style={{ gap: 10 }}>
                  <View style={styles.roomItem}>
                    <Text style={styles.roomNumber}>Habitación 101 (Doble Matrimonial)</Text>
                    <Text style={styles.roomGuests}>👥 Pasajeros: admin@travelapp.ar & Acompañante</Text>
                  </View>
                  <View style={styles.roomItem}>
                    <Text style={styles.roomNumber}>Habitación 102 (Doble Twin)</Text>
                    <Text style={styles.roomGuests}>👥 Pasajeros: Marcos Vignola (Coordinador) & Soporte</Text>
                  </View>
                  <View style={styles.roomItem}>
                    <Text style={styles.roomNumber}>Habitación 103 (Single)</Text>
                    <Text style={styles.roomGuests}>👤 Pasajero: Pasajero Premium</Text>
                  </View>
                </View>
              ) : (
                selectedTrip.roomingList.map((room: any, idx: number) => (
                  <View key={idx} style={styles.roomItem}>
                    <Text style={styles.roomNumber}>Habitación {room.roomNumber}</Text>
                    <Text style={styles.roomGuests}>{room.guests.length > 1 ? '👥 Pasajeros' : '👤 Pasajero'}: {room.guests.join(' & ')}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setRoomingModalVisible(false)}>
              <Text style={styles.closeBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONTROL DE ABORDAJE (CHECKLIST & QR) */}
      <Modal
        visible={boardingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBoardingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="bus" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Asistencia / Abordaje Micro</Text>
            </View>

            {/* Simulador de Escáner QR de Voucher */}
            <View style={styles.simulatedQrBox}>
              <Text style={styles.simulatedQrLabel}>Simular Escáner QR (Voucher Pasajero):</Text>
              <View style={styles.simulatedQrRow}>
                <TextInput
                  style={styles.simulatedQrInput}
                  placeholder="Ej: trip_checkin:UID:TRIP_ID"
                  value={simulatedQrInput}
                  onChangeText={setSimulatedQrInput}
                />
                <TouchableOpacity style={styles.simulatedQrBtn} onPress={handleSimulateQrScan}>
                  <Ionicons name="qr-code" size={16} color={Colors.white} />
                  <Text style={styles.simulatedQrBtnText}>Escanear</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.modalSubtitle}>Lista de pasajeros para control manual:</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220, width: '100%' }}>
              {passengersList.length === 0 ? (
                <Text style={styles.noDataText}>No hay pasajeros registrados.</Text>
              ) : (
                passengersList.map((passenger) => {
                  const isBoarded = !!boardingStatus[passenger.uid];
                  return (
                    <TouchableOpacity
                      key={passenger.uid}
                      style={styles.boardingPassengerRow}
                      onPress={() => handleToggleBoarding(passenger.uid, isBoarded)}
                    >
                      <Ionicons
                        name={isBoarded ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isBoarded ? Colors.success : Colors.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.boardingPassengerName, isBoarded && styles.boardingPassengerNameChecked]}>
                          {passenger.name}
                        </Text>
                        <Text style={styles.boardingPassengerMeta}>DNI: {passenger.passport}</Text>
                      </View>
                      <View style={[styles.boardingBadge, isBoarded ? { backgroundColor: Colors.success + '15' } : { backgroundColor: '#ECEFF1' }]}>
                        <Text style={[styles.boardingBadgeText, isBoarded ? { color: Colors.success } : { color: Colors.textMuted }]}>
                          {isBoarded ? 'ABORDADO' : 'PENDIENTE'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setBoardingModalVisible(false)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { color: Colors.white, fontSize: 16, fontFamily: 'Quicksand-Bold' },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Quicksand-Medium' },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  
  tripSelectorCard: { backgroundColor: Colors.white, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 6 },
  label: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  tripsScroll: { marginVertical: 4 },
  tripOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  tripOptionBtnActive: { backgroundColor: Colors.primary },
  tripOptionText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  tripOptionTextActive: { color: Colors.white },
  noTripsText: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Quicksand-Medium' },

  tabsRow: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, height: 60 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: Colors.accent },
  tabLabel: { fontSize: 10, fontFamily: 'Quicksand-Medium', color: '#94A3B8' },
  tabLabelActive: { color: Colors.accent, fontFamily: 'Quicksand-Bold' },

  mainScroll: { padding: 16, paddingBottom: 40 },
  tabContent: { gap: 16 },
  
  tripImg: { width: '100%', height: 160, borderRadius: 20 },
  tripMetaCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: Colors.border, gap: 6 },
  tripTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  tripDates: { fontSize: 13, fontFamily: 'Quicksand-Medium', color: Colors.accent },
  tripRecommendations: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18, marginTop: 4 },

  sectionTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.primary, marginVertical: 4 },
  servicesCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: Colors.border, gap: 12 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceText: { fontSize: 13, fontFamily: 'Quicksand-Medium', color: Colors.textPrimary },
  serviceTextChecked: { textDecorationLine: 'line-through', color: Colors.textMuted },

  noDataText: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, textAlign: 'center', marginVertical: 20 },

  passengerCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  passengerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerName: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  passengerDetails: { gap: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  detailText: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary },
  paymentBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusBadge: { backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: Colors.primary, fontSize: 10, fontFamily: 'Quicksand-Bold' },

  excursionCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  excursionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  excursionTitle: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, flex: 1 },
  excursionPrice: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  excursionDesc: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 16 },
  excursionSub: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.primary, marginTop: 4 },
  excursionPassengerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  excursionPassengerName: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textPrimary },
  payCashBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  payCashBtnText: { color: Colors.white, fontSize: 10, fontFamily: 'Quicksand-Bold' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success + '12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  paidBadgeText: { color: Colors.success, fontSize: 10, fontFamily: 'Quicksand-Bold' },

  chatBox: { height: 350, backgroundColor: Colors.white, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  chatScroll: { flex: 1, backgroundColor: '#F8FAFC' },
  chatBubble: { padding: 10, borderRadius: 12, maxWidth: '85%', gap: 2 },
  chatBubbleMe: { backgroundColor: Colors.primary + '15', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  chatBubbleSystem: { backgroundColor: '#ECEFF1', alignSelf: 'center', borderRadius: 8 },
  chatBubbleOther: { backgroundColor: Colors.accent + '12', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  chatSender: { fontSize: 9, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  chatText: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textPrimary },
  chatInputRow: { flexDirection: 'row', padding: 10, gap: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  chatInput: { flex: 1, backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontFamily: 'Quicksand-Regular' },
  sendBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  // Botones logísticos del coordinador
  logisticsRow: {
    flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 8,
  },
  logisticsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12,
  },
  logisticsBtnText: { color: Colors.white, fontSize: 11, fontFamily: 'Quicksand-Bold' },

  // Alerta de chat
  chatAlertRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFE08230', paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  chatAlertLabel: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: '#FF7A00' },

  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 24, padding: 22, gap: 12, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  modalTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 16, alignSelf: 'flex-start' },
  closeBtn: {
    backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 8,
  },
  closeBtnText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },

  // Rooming list
  roomItem: {
    width: '100%', backgroundColor: Colors.background, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1.2, borderColor: Colors.border, gap: 4,
  },
  roomNumber: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  roomGuests: { fontSize: 11, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },

  // Simulador de escaneo
  simulatedQrBox: {
    width: '100%', backgroundColor: Colors.primary + '08', borderRadius: 16, padding: 12,
    borderWidth: 1.2, borderColor: Colors.primary + '20', gap: 6,
  },
  simulatedQrLabel: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  simulatedQrRow: { flexDirection: 'row', gap: 8 },
  simulatedQrInput: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 10, paddingHorizontal: 10,
    fontSize: 12, fontFamily: 'Quicksand-Regular', borderWidth: 1, borderColor: Colors.border,
  },
  simulatedQrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary,
    paddingHorizontal: 12, borderRadius: 10,
  },
  simulatedQrBtnText: { color: Colors.white, fontSize: 11, fontFamily: 'Quicksand-Bold' },

  // Boarding Checklist rows
  boardingPassengerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9', width: '100%',
  },
  boardingPassengerName: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  boardingPassengerNameChecked: { textDecorationLine: 'line-through', color: Colors.textMuted },
  boardingPassengerMeta: { fontSize: 10, fontFamily: 'Quicksand-Regular', color: Colors.textMuted },
  boardingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  boardingBadgeText: { fontSize: 9, fontFamily: 'Quicksand-Bold' },
});
