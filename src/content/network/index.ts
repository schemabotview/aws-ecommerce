import type { Course, Section } from '../types'

// Course 5 · Give it a network. In the pilot: its first section only, a ◆ full-scene detour.

const addressesAndCidr: Section = {
  id: 'addresses-and-cidr',
  title: 'Addresses and CIDR: carving the shop\'s network',
  scene: 'network-cidr',
  narration:
    "Before the book shop gets a network, it needs a plan for its addresses, and this frame is that plan. Start on the left with the notation. Ten dot twenty dot zero dot zero slash sixteen means: the first sixteen bits, ten dot twenty, are fixed, and the last sixteen are free for hosts. Two to the power of thirty two minus sixteen is sixty five thousand five hundred and thirty six addresses. A slash twenty four fixes twenty four bits, and leaves two hundred and fifty six. Under the table is the real output of a small Python program, the address plan run locally with Python's own I P address module. In the middle is that plan as a picture. The V P C, the shop's private network, takes the whole slash sixteen. It is carved into nine slash twenty fours: three tiers, each in three Availability Zones. The public tier, ten dot twenty dot zero to two, faces the internet: the load balancer and the N A T gateways will live there. The app tier, ten dot twenty dot ten to twelve, holds the shop's tasks. The data tier, ten dot twenty dot twenty to twenty two, holds the database. The gaps between ten and twenty leave room for each tier to grow, and below them, the rest of the range is free: room for two hundred and thirty three more subnets. Only three and a half percent is used. On the right, we open up one subnet, public c. Of its two hundred and fifty six addresses, A W S keeps five: the network address, the V P C router, the D N S resolver, one reserved for later, and the broadcast address. Two hundred and fifty one are left for the shop. Next, we build this V P C in Terraform.",
}

export const network: Course = {
  id: 'network',
  title: 'Give it a network',
  sections: [addressesAndCidr],
}
