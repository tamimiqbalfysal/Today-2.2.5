'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, Plus } from 'lucide-react';
import { useDrawer } from '@/contexts/drawer-context';
import type { DrawerApp } from '@/contexts/drawer-context';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

const apps: DrawerApp[] = [
  { id: 'think', name: 'Think', logo: '/think-logo.png', href: '/think' },
  { id: 'findit', name: 'Findit', logo: '/findit-logo.png', href: '#' },
  { id: 'mingle', name: 'Mingle', logo: '/mingle-logo.png', href: '#' },
  { id: 'thankug', name: 'Thanku G', logo: '/thankug-logo.png', href: '/thank-you' },
  { id: 'attom', name: 'Attom', logo: 'https://placehold.co/48x48/9ca3af/FFFFFF?text=A', href: '/attom' },
  { id: 'bitt', name: 'Bitt', logo: 'https://placehold.co/48x48/fde047/000000?text=B', href: '/bitt' },
];

const moreApps: DrawerApp[] = [
  { id: 'app1', name: 'App One', logo: 'https://placehold.co/48x48/ff0000/FFFFFF?text=A1', href: '#' },
  { id: 'app2', name: 'App Two', logo: 'https://placehold.co/48x48/00ff00/FFFFFF?text=A2', href: '#' },
  { id: 'app3', name: 'App Three', logo: 'https://placehold.co/48x48/0000ff/FFFFFF?text=A3', href: '#' },
];

export default function AddPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { addAppToDrawer, isAppInDrawer } = useDrawer();
  const { toast } = useToast();
  const [newAppName, setNewAppName] = useState('');
  const [newAppHref, setNewAppHref] = useState('');

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMoreApps, setShowMoreApps] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const currentScrollY = scrollContainerRef.current.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newAppHref.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide both a name and a link.',
      });
      return;
    }

    const newAppId = `${newAppName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    const newApp: DrawerApp = {
      id: newAppId,
      name: newAppName,
      href: newAppHref,
      logo: `https://placehold.co/48x48/cccccc/FFFFFF?text=${newAppName.charAt(0).toUpperCase()}`,
    };

    addAppToDrawer(newApp);
    setNewAppName('');
    setNewAppHref('');
  };

  return (
      <div className="flex flex-col h-screen">
        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="container mx-auto max-w-2xl p-4 flex flex-col items-center justify-center">
            <div className="w-full space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Add Your Personal Favourite</CardTitle>
                  <CardDescription className="text-center">
                    Add a link to your drawer for quick access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCustomApp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="appName">Name</Label>
                      <Input
                        id="appName"
                        placeholder="Example"
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appLink">Link</Label>
                      <Input
                        id="appLink"
                        type="url"
                        placeholder="https://example.com"
                        value={newAppHref}
                        onChange={(e) => setNewAppHref(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Add
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Our Suggestions</CardTitle>
                  <CardDescription className="text-center">Access instantly.</CardDescription>
                </CardHeader>
                <div className="px-6 pb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search links..."
                      className="w-full pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <CardContent>
                  {filteredApps.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {filteredApps.map((app) => {
                        const isAdded = isAppInDrawer(app.id);
                        return (
                          <div key={app.id} className="flex flex-col items-center justify-between p-4 h-full border rounded-lg space-y-4">
                            <div className="flex flex-col items-center space-y-2 text-center">
                              <Image src={app.logo} alt={`${app.name} logo`} width={48} height={48} />
                              <p className="mt-2 font-semibold text-lg">{app.name}</p>
                            </div>
                            <div className="w-full mt-auto space-y-2">
                              <Button asChild className="w-full" variant="outline">
                                <Link href={app.href}>View</Link>
                              </Button>
                              <Button
                                onClick={() => addAppToDrawer(app)}
                                disabled={isAdded}
                                className="w-full"
                                variant={isAdded ? 'secondary' : 'default'}
                              >
                                {isAdded ? <CheckCircle className="mr-2" /> : null}
                                {isAdded ? 'Added' : 'Add'}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No applications found.</p>
                    </div>
                  )}
                  <div className="text-center mt-4">
                    <Button variant="ghost" onClick={() => setShowMoreApps(!showMoreApps)}>
                      {showMoreApps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  {showMoreApps && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      {moreApps.map((app) => {
                        const isAdded = isAppInDrawer(app.id);
                        return (
                          <div key={app.id} className="flex flex-col items-center justify-between p-4 h-full border rounded-lg space-y-4">
                            <div className="flex flex-col items-center space-y-2 text-center">
                              <Image src={app.logo} alt={`${app.name} logo`} width={48} height={48} />
                              <p className="mt-2 font-semibold text-lg">{app.name}</p>
                            </div>
                             {/* Add button/link functionality similar to the apps above if needed */}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
  );
}
