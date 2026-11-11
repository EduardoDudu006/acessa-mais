import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import {
  Home, Map, AlertTriangle, Route, FileText, BarChart2,
  Award, User, Settings, Search, Bell, Footprints
} from 'lucide-react-native';

const logoPrincipal = require('./assets/logo-acessa-mais.png');
const logoLogin = require('./assets/logo-completo.png');

const API_URL = 'https://acessa-backend.onrender.com/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Platform.OS === 'web' ? localStorage.getItem('acessa_logado') === 'true' : false;
  });

  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    if (Platform.OS === 'web') {
      const saved = localStorage.getItem('acessa_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [emailInput, setEmailInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [nomeInput, setNomeInput] = useState('');
  const [isCadastro, setIsCadastro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [activeMenu, setActiveMenu] = useState('Inicio');
  const [destinoBusca, setDestinoBusca] = useState('');
  const [rotaAtiva, setRotaAtiva] = useState(false);
  const [dadosRota, setDadosRota] = useState({ distancia: '1.4 km', tempo: '18 min a pé', instrucoes: 'Siga pela Rua do Imperador.' });

  const handleAutenticar = async () => {
    if (!emailInput || !senhaInput) {
      alert('Preencha o e-mail e a senha.');
      return;
    }

    setCarregando(true);
    try {
      const endpoint = isCadastro ? `${API_URL}/register` : `${API_URL}/login`;
      const payload = isCadastro ? { email: emailInput, senha: senhaInput, nome: nomeInput } : { email: emailInput, senha: senhaInput };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.erro || 'Erro na autenticação.');
        setCarregando(false);
        return;
      }

      alert(data.mensagem);
      setUsuarioLogado(data.usuario);
      setIsLoggedIn(true);

      if (Platform.OS === 'web') {
        localStorage.setItem('acessa_logado', 'true');
        localStorage.setItem('acessa_user', JSON.stringify(data.usuario));
      }
    } catch (err) {
      alert('Servidor no Render em Cold Start. Aguarde 30 segundos e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsuarioLogado(null);
    if (Platform.OS === 'web') {
      localStorage.removeItem('acessa_logado');
      localStorage.removeItem('acessa_user');
    }
  };

  const handleBuscarRotaPedestre = () => {
    if (!destinoBusca) return alert('Digite para onde deseja ir.');
    setRotaAtiva(true);
    setActiveMenu('Mapa');
    setDadosRota({ distancia: '1.4 km', tempo: '18 min a pé', instrucoes: `Rota segura para pedestres até: ${destinoBusca}.` });
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.authWrapper}>
        <View style={styles.authCard}>
          <View style={styles.authLogoContainer}>
            <Image source={logoLogin} style={styles.authLogoImage} resizeMode="contain" />
            <Text style={styles.authSubtitle}>Cidade para todas as pessoas</Text>
          </View>

          <View style={styles.authForm}>
            <Text style={styles.authLabel}>{isCadastro ? 'Criar Nova Conta' : 'Acesse sua Conta'}</Text>

            {isCadastro && (
              <>
                <Text style={styles.authInstruction}>Nome Completo:</Text>
                <TextInput style={styles.authInput} placeholder="Seu Nome" placeholderTextColor="#A0AEC0" value={nomeInput} onChangeText={setNomeInput} />
              </>
            )}

            <Text style={styles.authInstruction}>E-mail:</Text>
            <TextInput style={styles.authInput} placeholder="seu.email@exemplo.com" placeholderTextColor="#A0AEC0" value={emailInput} onChangeText={setEmailInput} autoCapitalize="none" />

            <Text style={styles.authInstruction}>Senha:</Text>
            <TextInput style={styles.authInput} placeholder="Sua senha secreta" placeholderTextColor="#A0AEC0" secureTextEntry value={senhaInput} onChangeText={setSenhaInput} />

            <TouchableOpacity style={[styles.authPrimaryButton, carregando && { opacity: 0.7 }]} onPress={handleAutenticar} disabled={carregando}>
              <Text style={styles.authPrimaryButtonText}>{carregando ? 'Conectando...' : (isCadastro ? 'Cadastrar' : 'Entrar')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsCadastro(!isCadastro)} style={{ marginTop: 15, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#0B3D91', fontWeight: '700' }}>
                {isCadastro ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'Inicio':
      case 'Mapa':
        return (
          <View style={styles.contentBody}>
            <View style={styles.mapColumn}>
              <View style={styles.mapBox}>
                {Platform.OS === 'web' ? (
                  <iframe title="Mapa" width="100%" height="100%" style={{ border: 0 }} src="https://maps.google.com/maps?q=-8.05428,-34.8813&z=15&output=embed" />
                ) : (
                  <View style={styles.mapFallback}><Text style={styles.fallbackText}>Mapa em Tempo Real</Text></View>
                )}

                {rotaAtiva && (
                  <View style={styles.gpsNavigationCard}>
                    <View style={styles.gpsHeaderRow}>
                      <Footprints color="#00A86B" size={20} />
                      <Text style={styles.gpsTitle}>Navegação a Pé Ativa</Text>
                      <TouchableOpacity onPress={() => setRotaAtiva(false)}><Text style={styles.gpsCloseText}>✕ Fechar</Text></TouchableOpacity>
                    </View>
                    <Text style={styles.gpsDestText}>Destino: {destinoBusca}</Text>
                    <Text style={styles.gpsInstruction}>{dadosRota.instrucoes}</Text>
                  </View>
                )}
              </View>
            </View>

            <ScrollView style={styles.statsColumn}>
              <Text style={styles.statsTitle}>Resumo da Cidade</Text>
              <Text style={styles.statSubText}>Recife - PE | Acessibilidade Urbana</Text>
            </ScrollView>
          </View>
        );
      case 'Perfil':
        return (
          <ScrollView style={styles.fullPane}>
            <Text style={styles.paneTitle}>Perfil do Usuário</Text>
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Nome: {usuarioLogado?.nome}</Text>
              <Text style={styles.formLabel}>E-mail: {usuarioLogado?.email}</Text>
              <Text style={styles.formLabel}>Pontuação: {usuarioLogado?.pontos} pontos</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogout}>
                <Text style={styles.primaryButtonText}>Sair da Conta (Logout)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      default:
        return <View style={styles.fullPane}><Text style={styles.paneTitle}>Módulo em Desenvolvimento</Text></View>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.logoContainer}>
          <Image source={logoPrincipal} style={styles.logoImage} resizeMode="contain" />
        </View>

        <View style={styles.menuList}>
          {[
            { id: 'Inicio', label: 'Início', icon: Home },
            { id: 'Mapa', label: 'Mapa', icon: Map },
            { id: 'Rotas', label: 'Rotas Acessíveis', icon: Route },
            { id: 'Perfil', label: 'Perfil', icon: User },
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <TouchableOpacity key={item.id} style={[styles.menuItem, isActive && styles.menuItemActive]} onPress={() => setActiveMenu(item.id)}>
                <IconComponent size={18} color={isActive ? '#FFFFFF' : '#8A99AD'} />
                <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.userProfileFooter}>
          <View style={styles.avatarCircle}><Text style={styles.avatarInitials}>{usuarioLogado?.nome?.[0] || 'U'}</Text></View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{usuarioLogado?.nome || 'Usuário'}</Text>
            <Text style={styles.userRole}>{usuarioLogado?.pontos || 320} pontos</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainWrapper}>
        <View style={styles.topHeader}>
          <View style={styles.searchContainer}>
            <Search color="#8A99AD" size={16} />
            <TextInput placeholder="Para onde você quer ir a pé?" placeholderTextColor="#8A99AD" style={styles.searchInput} value={destinoBusca} onChangeText={setDestinoBusca} onSubmitEditing={handleBuscarRotaPedestre} />
            <TouchableOpacity onPress={handleBuscarRotaPedestre} style={styles.searchButtonMini}><Text style={styles.searchButtonMiniText}>Ir a pé</Text></TouchableOpacity>
          </View>
        </View>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F0F4F8' },
  authWrapper: { flex: 1, backgroundColor: '#041E42', justifyContent: 'center', alignItems: 'center', padding: 20 },
  authCard: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30 },
  authLogoContainer: { alignItems: 'center', marginBottom: 20 },
  authLogoImage: { width: 220, height: 80, resizeMode: 'contain' },
  authSubtitle: { fontSize: 11, fontWeight: '700', color: '#718096', marginTop: 4 },
  authForm: { gap: 10 },
  authLabel: { fontSize: 18, fontWeight: '900', color: '#0B3D91', marginBottom: 6 },
  authInstruction: { fontSize: 12, color: '#4A5568' },
  authInput: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 10, padding: 12, fontSize: 13, color: '#1F2937' },
  authPrimaryButton: { backgroundColor: '#FF7A00', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  authPrimaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  sidebar: { width: 250, backgroundColor: '#041E42', padding: 16, justifyContent: 'space-between' },
  logoContainer: { marginBottom: 20, alignItems: 'center' },
  logoImage: { width: 180, height: 50, resizeMode: 'contain' },
  menuList: { gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, gap: 10 },
  menuItemActive: { backgroundColor: '#0B3D91' },
  menuText: { fontSize: 13, color: '#8A99AD', fontWeight: '600' },
  menuTextActive: { color: '#FFFFFF', fontWeight: '700' },
  userProfileFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#0F2D59' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#0B3D91', fontWeight: '800', fontSize: 13 },
  userInfo: { flex: 1 },
  userName: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  userRole: { color: '#8A99AD', fontSize: 10 },
  mainWrapper: { flex: 1, flexDirection: 'column' },
  topHeader: { height: 60, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, width: 380, gap: 8 },
  searchInput: { flex: 1, fontSize: 12, color: '#1F2937' },
  searchButtonMini: { backgroundColor: '#00A86B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  searchButtonMiniText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  contentBody: { flex: 1, flexDirection: 'row', padding: 16, gap: 16 },
  mapColumn: { flex: 2 },
  mapBox: { flex: 1, borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#CBD5E0' },
  mapFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: '#4A5568', fontWeight: '700' },
  gpsNavigationCard: { position: 'absolute', top: 16, left: 16, right: 16, backgroundColor: '#041E42', borderRadius: 12, padding: 14 },
  gpsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  gpsTitle: { flex: 1, color: '#00A86B', fontSize: 13, fontWeight: '900' },
  gpsCloseText: { color: '#A0AEC0', fontSize: 11, fontWeight: '700' },
  gpsDestText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  gpsInstruction: { color: '#E2E8F0', fontSize: 11, fontStyle: 'italic' },
  statsColumn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  statsTitle: { fontSize: 14, fontWeight: '800', color: '#0B3D91', marginBottom: 6 },
  statSubText: { fontSize: 12, color: '#4A5568' },
  fullPane: { flex: 1, padding: 24, backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16 },
  paneTitle: { fontSize: 20, fontWeight: '900', color: '#0B3D91', marginBottom: 6 },
  formCard: { backgroundColor: '#F7FAFC', padding: 20, borderRadius: 12, gap: 12 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#2D3748' },
  primaryButton: { backgroundColor: '#FF7A00', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
