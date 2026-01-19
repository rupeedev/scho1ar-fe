Frontend tech stack:                                        
                                                                                                          
  Core Framework                                                                                          
  ┌────────────┬─────────┬─────────────────────────┐                                                      
  │ Technology │ Version │         Purpose         │                                                      
  ├────────────┼─────────┼─────────────────────────┤                                                      
  │ React      │ 18.3.1  │ UI Library              │                                                      
  ├────────────┼─────────┼─────────────────────────┤                                                      
  │ TypeScript │ 5.5.3   │ Type Safety             │                                                      
  ├────────────┼─────────┼─────────────────────────┤                                                      
  │ Vite       │ 5.4.1   │ Build Tool & Dev Server │                                                      
  └────────────┴─────────┴─────────────────────────┘                                                      
  UI & Styling                                                                                            
  ┌─────────────────────┬───────────────────────────────────────┐                                         
  │     Technology      │                Purpose                │                                         
  ├─────────────────────┼───────────────────────────────────────┤                                         
  │ Tailwind CSS 3.4.11 │ Utility-first CSS                     │                                         
  ├─────────────────────┼───────────────────────────────────────┤                                         
  │ shadcn/ui           │ Component Library (built on Radix UI) │                                         
  ├─────────────────────┼───────────────────────────────────────┤                                         
  │ Radix UI            │ Headless UI Primitives                │                                         
  ├─────────────────────┼───────────────────────────────────────┤                                         
  │ Lucide React        │ Icons                                 │                                         
  └─────────────────────┴───────────────────────────────────────┘                                         
  State & Data Management                                                                                 
  ┌────────────────────────┬─────────────────────────┐                                                    
  │       Technology       │         Purpose         │                                                    
  ├────────────────────────┼─────────────────────────┤                                                    
  │ TanStack Query 4.29.25 │ Server State Management │                                                    
  ├────────────────────────┼─────────────────────────┤                                                    
  │ React Hook Form 7.53.0 │ Form Handling           │                                                    
  ├────────────────────────┼─────────────────────────┤                                                    
  │ Zod 3.23.8             │ Schema Validation       │                                                    
  └────────────────────────┴─────────────────────────┘                                                    
  Routing & Navigation                                                                                    
  ┌─────────────────────┬─────────────────────┐                                                           
  │     Technology      │       Purpose       │                                                           
  ├─────────────────────┼─────────────────────┤                                                           
  │ React Router 6.26.2 │ Client-side Routing │                                                           
  └─────────────────────┴─────────────────────┘                                                           
  Authentication                                                                                          
  ┌──────────────────────┬──────────────────────┐                                                         
  │      Technology      │       Purpose        │                                                         
  ├──────────────────────┼──────────────────────┤                                                         
  │ Supabase Auth 2.49.4 │ Authentication (JWT) │                                                         
  └──────────────────────┴──────────────────────┘                                                         
  Data Visualization                                                                                      
  ┌───────────────────┬───────────────────────────┐                                                       
  │    Technology     │          Purpose          │                                                       
  ├───────────────────┼───────────────────────────┤                                                       
  │ Recharts 2.12.7   │ Charts & Graphs           │                                                       
  ├───────────────────┼───────────────────────────┤                                                       
  │ ReactFlow 11.11.4 │ Network Topology Diagrams │                                                       
  ├───────────────────┼───────────────────────────┤                                                       
  │ Dagre 0.8.5       │ Graph Layout              │                                                       
  └───────────────────┴───────────────────────────┘                                                       
  Other                                                                                                   
  ┌─────────────────┬─────────────────────┐                                                               
  │   Technology    │       Purpose       │                                                               
  ├─────────────────┼─────────────────────┤                                                               
  │ date-fns 3.6.0  │ Date Utilities      │                                                               
  ├─────────────────┼─────────────────────┤                                                               
  │ Sonner          │ Toast Notifications │                                                               
  ├─────────────────┼─────────────────────┤                                                               
  │ Stripe.js 7.3.0 │ Payment Integration │                                                               
  └─────────────────┴─────────────────────┘                                                               
  Architecture Pattern                                                                                    
                                                                                                          
  Frontend (React) → API Client → Backend API (NestJS) → Database (PostgreSQL)                            
                  → Supabase Auth (authentication only)