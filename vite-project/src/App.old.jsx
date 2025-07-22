// This is a simple React + Firebase webapp for a rewards system.
// Key features: Sign-up, roles (User/Admin), points, badge shop, leaderboard, admin panel

import { useState, useEffect } from 'react';
//  import { Card, CardContent } from "@/components/ui/card";
//  import { Button } from "@/components/ui/button";
//  import { Input } from "@/components/ui/input";
import { db, auth } from './firebase';
import {
  collection, doc, getDoc, getDocs, updateDoc, setDoc, onSnapshot
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      setLeaderboard(data.sort((a, b) => b.points - a.points));
    });
    return unsubscribe;
  }, []);

  const signUp = async () => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      points: 0,
      badges: [],
      role: 'user'
    });
  };

  const signIn = async () => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    setUser({ id: cred.user.uid, ...userDoc.data() });
  };

  const awardPoints = async (id, amount) => {
    const ref = doc(db, 'users', id);
    const snap = await getDoc(ref);
    await updateDoc(ref, { points: snap.data().points + amount });
  };

  const redeemBadge = async (badgeName, cost) => {
    const ref = doc(db, 'users', user.id);
    if (user.points >= cost) {
      await updateDoc(ref, {
        points: user.points - cost,
        badges: [...user.badges, badgeName]
      });
    }
  };

  const renderAdminPanel = () => (
    <Card className="p-4 my-4">
      <h2 className="text-xl font-bold">Admin Panel</h2>
      {users.map(u => (
        <div key={u.id} className="flex gap-2 my-2">
          <div>{u.email} - {u.points} points</div>
          <Button onClick={() => awardPoints(u.id, 10)}>+10</Button>
          <Button onClick={() => awardPoints(u.id, -10)}>-10</Button>
        </div>
      ))}
    </Card>
  );

  const renderShop = () => (
    <Card className="p-4 my-4">
      <h2 className="text-xl font-bold">Badge Shop</h2>
      {['Gold Star', 'Rocket', 'Crown'].map((badge, i) => (
        <div key={i} className="flex gap-2 my-2">
          <div>{badge} - {10 * (i + 1)} pts</div>
          <Button onClick={() => redeemBadge(badge, 10 * (i + 1))}>Redeem</Button>
        </div>
      ))}
    </Card>
  );

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Sign Up / Sign In</h1>
        <Input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <Button onClick={signUp}>Sign Up</Button>
        <Button onClick={signIn}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Welcome {user.email}</h1>
      <p>You have {user.points} points.</p>
      {renderShop()}
      <Card className="p-4 my-4">
        <h2 className="text-xl font-bold">Leaderboard</h2>
        {leaderboard.map((u, i) => (
          <div key={i}>{i + 1}. {u.email} - {u.points} pts - Badges: {u.badges.join(', ')}</div>
        ))}
      </Card>
      {user.role === 'admin' && renderAdminPanel()}
    </div>
  );
}

// Note: You need to set up Firebase project and configure Firebase Auth and Firestore.
// Also, create a file called firebase.js to export configured `db` and `auth` instances.
