'use client';

import { useUser } from '@clerk/nextjs';

export default function SimplePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div style={{ padding: '20px' }}>Loading user...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Page</h1>
      {user ? (
        <p>Hello {user.firstName}!</p>
      ) : (
        <p>Not signed in</p>
      )}
      <div style={{ background: 'blue', color: 'white', padding: '10px', marginTop: '10px' }}>
        This should be blue if CSS is working
      </div>
    </div>
  );
}