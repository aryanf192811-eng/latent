import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const qk = {
  posts:        (f)      => ['posts', f],
  post:         (id)     => ['post', id],
  events:       (f)      => ['events', f],
  event:        (id)     => ['event', id],
  mapLocs:      ()       => ['map'],
  todayCheckins:()       => ['checkins', 'today'],
  mess:         ()       => ['mess', 'today'],
  messList:     ()       => ['mess', 'list'],
  messMenu:     (id)     => ['mess', 'menu', id],
  wallet:       ()       => ['mess', 'wallet'],
  tickets:      (s)      => ['tickets', s],
  clubs:        (c)      => ['clubs', c],
  club:         (id)     => ['club', id],
  people:       (f)      => ['people', f],
  profile:      (id)     => ['profile', id],
  lostFound:    (t, s)   => ['lf', t, s],
  market:       (c)      => ['market', c],
  studyGroups:  (f)      => ['sg', f],
  seniors:      (d)      => ['seniors', d],
  notifs:       ()       => ['notifs'],
  pulse:        ()       => ['pulse'],
  weather:      ()       => ['weather'],
  newCount:     (f, s)   => ['newcount', f, s],
};
