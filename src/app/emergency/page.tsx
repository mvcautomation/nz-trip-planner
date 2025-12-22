'use client';

import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import OfflineIndicator from '@/components/OfflineIndicator';

const emergencyContacts = [
  {
    name: 'Emergency Services',
    number: '111',
    description: 'Police, Fire, Ambulance',
    icon: '🚨',
    urgent: true,
  },
  {
    name: 'Non-Emergency Police',
    number: '105',
    description: 'For non-urgent police matters',
    icon: '👮',
  },
  {
    name: 'Healthline',
    number: '0800 611 116',
    description: 'Free 24/7 health advice',
    icon: '🏥',
  },
  {
    name: 'Poison Control',
    number: '0800 764 766',
    description: '24/7 poison information',
    icon: '☠️',
  },
  {
    name: 'Roadside Assistance (AA)',
    number: '0800 500 222',
    description: 'Vehicle breakdown assistance',
    icon: '🚗',
  },
];

const embassyInfo = [
  {
    country: 'Australia',
    address: '72-76 Hobson Street, Wellington',
    phone: '+64 4 473 6411',
  },
  {
    country: 'United States',
    address: '29 Fitzherbert Terrace, Wellington',
    phone: '+64 4 462 6000',
  },
  {
    country: 'United Kingdom',
    address: '44 Hill Street, Wellington',
    phone: '+64 4 924 2888',
  },
  {
    country: 'Canada',
    address: '125 The Terrace, Wellington',
    phone: '+64 4 473 9577',
  },
];

const hospitals = [
  {
    region: 'Auckland',
    name: 'Auckland City Hospital',
    address: '2 Park Road, Grafton',
    phone: '+64 9 367 0000',
  },
  {
    region: 'Wellington',
    name: 'Wellington Regional Hospital',
    address: '49 Riddiford St, Newtown',
    phone: '+64 4 385 5999',
  },
  {
    region: 'Christchurch',
    name: 'Christchurch Hospital',
    address: '2 Riccarton Ave',
    phone: '+64 3 364 0640',
  },
  {
    region: 'Queenstown',
    name: 'Lakes District Hospital',
    address: '20 Douglas Street, Frankton',
    phone: '+64 3 441 0015',
  },
  {
    region: 'Greymouth',
    name: 'Grey Base Hospital',
    address: 'High Street',
    phone: '+64 3 769 7400',
  },
];

export default function EmergencyPage() {
  return (
    <main className="page-with-bg">
      <OfflineIndicator />
      <div className="safe-bottom p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-red-400">Emergency Info</h1>
            <div className="w-6" />
          </div>

          {/* Emergency Alert */}
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🚨</span>
              <p className="font-bold text-red-300">In an Emergency, Call 111</p>
            </div>
            <p className="text-sm text-gray-300">
              Works for Police, Fire, and Ambulance services across New Zealand
            </p>
            <a
              href="tel:111"
              className="mt-3 block w-full bg-red-600 hover:bg-red-700 text-center py-3 rounded-lg font-bold transition-colors"
            >
              Call 111
            </a>
          </div>

          {/* Emergency Contacts */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Emergency Contacts</h2>
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <a
                  key={contact.number}
                  href={`tel:${contact.number.replace(/\s/g, '')}`}
                  className={`block rounded-lg p-4 transition-colors ${
                    contact.urgent
                      ? 'bg-red-900/30 border border-red-500/30 hover:bg-red-900/50'
                      : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{contact.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-400">{contact.description}</p>
                    </div>
                    <p className="font-mono font-bold text-blue-400">{contact.number}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Nearby Hospitals */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Major Hospitals</h2>
            <div className="space-y-3">
              {hospitals.map((hospital) => (
                <div
                  key={hospital.name}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-blue-400 uppercase tracking-wide">
                        {hospital.region}
                      </p>
                      <p className="font-medium">{hospital.name}</p>
                    </div>
                    <a
                      href={`tel:${hospital.phone.replace(/\s/g, '')}`}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Call
                    </a>
                  </div>
                  <p className="text-sm text-gray-400">{hospital.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      hospital.name + ' ' + hospital.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white mt-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Get Directions
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Embassy Info */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Embassies in Wellington</h2>
            <div className="space-y-3">
              {embassyInfo.map((embassy) => (
                <div
                  key={embassy.country}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{embassy.country}</p>
                      <p className="text-sm text-gray-400">{embassy.address}</p>
                    </div>
                    <a
                      href={`tel:${embassy.phone.replace(/\s/g, '')}`}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {embassy.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Useful Tips */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Useful Information</h2>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
              <div>
                <p className="font-medium text-yellow-400">Driving in NZ</p>
                <p className="text-sm text-gray-400">
                  Drive on the left side. Speed limits: 100km/h on highways, 50km/h in towns.
                  Be cautious on winding mountain roads.
                </p>
              </div>
              <div>
                <p className="font-medium text-yellow-400">Weather</p>
                <p className="text-sm text-gray-400">
                  NZ weather changes quickly. Always carry rain gear and layers, especially
                  in the South Island mountains.
                </p>
              </div>
              <div>
                <p className="font-medium text-yellow-400">Mobile Coverage</p>
                <p className="text-sm text-gray-400">
                  Coverage can be limited in remote areas. Download offline maps before
                  heading to Milford Sound, Fox Glacier, or other remote locations.
                </p>
              </div>
              <div>
                <p className="font-medium text-yellow-400">Water Safety</p>
                <p className="text-sm text-gray-400">
                  NZ tap water is safe to drink. For tramping, carry water or use purification
                  tablets for stream water.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
