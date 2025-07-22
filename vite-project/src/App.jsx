import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection, doc, getDoc, updateDoc, setDoc, onSnapshot
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { toast, Toaster } from 'react-hot-toast';

function showToastSafe(type, message) {
  try {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast(message);
  } catch (e) {
    alert(message);
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSignupEnabled = false;
  const isSigninEnabled = true;
  const SignupDisabledReason = 'Development in progress';
  const badgeShop = [
    { name: 'Merch Item #1', cost: 10 },
    { name: 'Rank', cost: 20 },
    { name: 'Merch Item #2', cost: 30 }
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      setLeaderboard(data.sort((a, b) => b.points - a.points));
      if (user) {
  const updated = data.find(u => u.id === user.id);
  if (updated) {
    setUser(updated);
  } else {
    // User was deleted from Firestore
    showToastSafe('error', 'Your account was removed.');
    auth.signOut();
    setUser(null);
  }
}

      setLoading(false);
    });
    return unsubscribe;
  }, [user?.id]);

  const signUp = async () => {
    if (isSignupEnabled) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        points: 10,
        badges: [],
        role: 'user'
      });
      showToastSafe('success', 'Account created successfully');
    } else {
      showToastSafe('error', `Sign-up has been disabled by admin due to: ${SignupDisabledReason}`);
    }
  };

  const signIn = async () => {
  try {
    if (isSigninEnabled) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', cred.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        showToastSafe('error', 'Your account was removed. Please contact an admin.');
        await auth.signOut();
        setUser(null);
        return;
      }

      setUser({ id: cred.user.uid, ...userDoc.data() });
      showToastSafe('success', 'Signed in successfully');
    } else {
      showToastSafe('error', 'Sign-in has been disabled by admin')
    }
  } catch (e) {
    showToastSafe('error', e.message);
  }
  };


  const awardPoints = async (id, amount) => {
    const ref = doc(db, 'users', id);
    const snap = await getDoc(ref);
    await updateDoc(ref, { points: snap.data().points + amount });
    showToastSafe('success', `${amount > 0 ? 'Awarded' : 'Revoked'} ${Math.abs(amount)} points`);
  };

  const redeemBadge = async (badgeName, cost) => {
    const ref = doc(db, 'users', user.id);
    if (user.points >= cost) {
      await updateDoc(ref, {
        points: user.points - cost,
        badges: [...user.badges, badgeName]
      });
      showToastSafe('success', `Redeemed ${badgeName} for ${cost} points`);
    } else {
      showToastSafe('error', 'Not enough points to redeem');
    }
  };

  const renderAdminPanel = () => (
    <div style={{ padding: '1rem', marginTop: '1rem', border: '1px solid gray' }}>
      <h2>Admin Panel</h2>
      {users.map(u => (
        <div key={u.id} style={{ marginBottom: '0.5rem' }}>
          <span>{u.email} - {u.points} points </span>
          <button onClick={() => awardPoints(u.id, 1)}>+1</button>
          <button onClick={() => awardPoints(u.id, 10)}>+10</button>
          <button onClick={() => awardPoints(u.id, 100)}>+100</button>
          <button onClick={() => awardPoints(u.id, -1)}>-1</button>
          <button onClick={() => awardPoints(u.id, -10)}>-10</button>
          <button onClick={() => awardPoints(u.id, -100)}>-100</button>
        </div>
      ))}
    </div>
  );

  const renderShop = () => (
    <div style={{ padding: '1rem', marginTop: '1rem', border: '1px solid gray' }}>
      <h2 style={{fontFamily: 'Roboto'}}>Redeem Points</h2>
      {badgeShop.map(({ name, cost }, i) => (
        <div key={i} style={{marginBottom: '0.5rem', margin: 'auto', display: 'block', fontFamily: 'Roboto'}}>
          <span>{name} - {cost} pts </span>
          <button onClick={() => redeemBadge(name, cost)}>Redeem</button>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div style={{padding: '1rem', textAlign: 'center'}}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: '1rem' }}>
        <Toaster />
        
        <title>Login | Slauson Robotics Points Webapp</title>
        <h1 style={{textAlign: 'center', fontFamily: 'Product Sans'}}>Slauson Robotics Points</h1>
        <input style={{textAlign: 'center', margin: 'auto', display: 'block'}} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={{textAlign: 'center', margin: 'auto', display: 'block'}} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ marginTop: '0.5rem' }}>
          <button style={{fontWeight: 'bold', margin: 'auto', display: 'block', fontFamily: 'Roboto'}} onClick={signUp}>Sign Up</button>
          <button style={{fontWeight: 'bold', margin: 'auto', display: 'block', fontFamily: 'Roboto'}} onClick={signIn}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <Toaster />
      <title>Account | Slauson Robotics Points Webapp</title>
      <h1 style={{fontFamily: 'Product Sans', textAlign: 'center'}}>Hello {user.email}!</h1>
      <p style={{fontFamily: 'Roboto', textAlign: 'center'}}>You have {user.points} points.</p>
      {renderShop()}
      <div style={{ padding: '1rem', marginTop: '1rem', border: '1px solid gray', fontFamily: 'Roboto'}}>
        <h2>Leaderboard</h2>
        {leaderboard.map((u, i) => (
          <div key={i}>{i + 1}. {u.email} - {u.points} pts - Rewards redeemed: {u.badges.join(', ')}</div>
        ))}
      </div>
      {user.role === 'admin' && renderAdminPanel()}
    </div>
  );
}
