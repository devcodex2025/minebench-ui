import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/refresh/WorkspaceLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FadeContent from '@/components/reactbits/FadeContent';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { ArrowUpRight, ArrowRight, Cpu, Network, ImageIcon, Film, Code2, Boxes, Users, Server, Check, Clock3 } from 'lucide-react';
import './iq.css';

export const metadata: Metadata = {
  title: 'MineBench IQ — Planned AI Compute Marketplace',
  description: 'Meet MineBench IQ: a planned marketplace connecting AI users and compute providers, built around open-source models and the MBIQ economy. Coming soon.',
  alternates: { canonical: 'https://iq.minebench.cloud/' },
  twitter: {card:'summary_large_image',title:'MineBench IQ — Planned AI Compute Marketplace',description:'A planned AI compute marketplace from MineBench. Coming soon.',images:['/img/minebench-iq-logo.png']},
  openGraph: { siteName: 'MineBench IQ', title: 'MineBench IQ — AI compute, within reach', description: 'A planned AI compute marketplace from MineBench. Explore the product direction and follow development.', url: 'https://iq.minebench.cloud/', images: [{url:'/img/minebench-iq-logo.png',width:1254,height:1254,alt:'MineBench IQ logo'}] },
};
const mint='EQ9mKupWSS4AHUSRVvKPghezPGKhgDTj2VF5hXdhPray';
const workloads=[
  {Icon:ImageIcon,name:'Image generation',text:'Access open-source image models through a simpler AI client.'},
  {Icon:Film,name:'Video generation',text:'Explore GPU-intensive creative workflows without setting up every model yourself.'},
  {Icon:Code2,name:'Text & code',text:'Run language and coding workloads using supported open-source models.'},
  {Icon:Boxes,name:'More AI workloads',text:'Help shape which models and tasks the first product should support.'},
];

export default function MineBenchIQPage(){
  return <div className="board-page iq-page relative flex min-h-screen flex-col"><Header/>
    <main id="refresh-content" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({"@context":"https://schema.org","@type":"WebSite",name:"MineBench IQ",url:"https://iq.minebench.cloud/"})}}/>
      <section className="iq-hero iq-container" aria-labelledby="iq-title">
        <div className="iq-hero-copy"><span className="iq-status"><Clock3 size={13} aria-hidden="true"/> Coming soon · Planned product</span>
          <p className="iq-overline">INTRODUCING MINEBENCH IQ</p>
          <h1 id="iq-title">AI compute.<br/><span>Within reach.</span></h1>
          <p className="iq-intro">A planned marketplace for people who need AI services and people who provide computing power. Open-source models. Useful workloads. A shared compute economy.</p>
          <div className="iq-actions"><a href="https://x.com/MineBenchdapp" target="_blank" rel="noopener noreferrer" className="refresh-button">Follow development <ArrowUpRight size={17}/></a><a href="#how-it-works" className="refresh-link">Explore the model <ArrowRight size={17}/></a></div>
          <p className="iq-development-note">Development has not started yet. The token is launched; the application is the next step.</p>
        </div>
        <figure className="iq-system" aria-label="MineBench IQ connects AI users with compute providers; proposed architecture">
          <div className="iq-system-top"><span>THE NEXT MINEBENCH PRODUCT</span><span>IQ / 01</span></div>
          <Image src="/img/minebench-iq-logo.png" alt="MineBench IQ" width={1254} height={1254} priority sizes="(max-width:760px) 220px, 300px" className="iq-product-logo"/>
          <figcaption>One connection.<br/><strong>Two sides of compute.</strong></figcaption>
          <div className="iq-system-ends"><span><Users size={18}/> AI users</span><ArrowRight size={17}/><span><Server size={18}/> Compute providers</span></div>
          <span className="iq-system-caption">PROPOSED MARKETPLACE MODEL</span>
        </figure>
      </section>
      <div className="iq-principles"><div className="iq-container"><span><Cpu size={17}/> Useful compute</span><span><Code2 size={17}/> Open-source models</span><span><Network size={17}/> Connected providers</span><span><Check size={17}/> Measured contribution</span></div></div>

      <FadeContent as="section" className="iq-container iq-section" id="workloads">
        <div className="iq-section-heading"><div><p className="iq-overline">01 / WHAT YOU COULD BUILD</p><h2>Start with the task.<br/>Leave the setup behind.</h2></div><p>The proposed client would make open-source AI models easier to use. These workload categories are under consideration, not available services.</p></div>
        <div className="iq-workloads">{workloads.map(({Icon,name,text})=><SpotlightCard key={name} className="iq-workload"><Icon size={25} aria-hidden="true"/><h3>{name}</h3><p>{text}</p><span className="iq-small-status">Planned</span></SpotlightCard>)}</div>
      </FadeContent>

      <FadeContent as="section" className="iq-container iq-section" id="how-it-works">
        <div className="iq-section-heading"><div><p className="iq-overline">02 / THE MARKETPLACE MODEL</p><h2>Demand meets<br/>computing power.</h2></div><p>The planned flow connects a customer request to available compute, then separates workload validation from provider payment.</p></div>
        <ol className="iq-flow">{[['01','Choose a workload','A customer requests an AI task through the client.'],['02','Match compute','The platform routes the task to supported, available hardware.'],['03','Process & validate','The workload runs and its result is checked.'],['04','Settle the work','The provider receives payment; the marketplace earns a service fee.']].map(([number,title,copy])=><li key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
        <p className="iq-note">Architecture, validation rules, fees and payment methods are still being designed. This flow describes the intended product.</p>
        <div className="iq-audiences"><article><Users size={24}/><h3>For AI users</h3><p>Use AI models without manually installing every runtime. The aim is to make supported workloads accessible through one client.</p></article><article><Server size={24}/><h3>For compute providers</h3><p>Offer supported hardware for useful AI work. Provider onboarding, eligibility and reward rules will be defined before access opens.</p></article></div>
      </FadeContent>

      <FadeContent as="section" className="iq-container iq-section" id="roadmap">
        <div className="iq-section-heading"><div><p className="iq-overline">03 / WHERE WE ARE</p><h2>A direction.<br/>Not a finished product.</h2></div><p>MineBench IQ is planned as a separate application. Follow the public updates for decisions, tests and releases as development begins.</p></div>
        <div className="iq-roadmap"><article><span className="iq-small-status iq-status-done">Launched</span><h3>MBIQ token</h3><p>The token exists for the planned IQ direction. Application access and marketplace functions are not live.</p></article><article><span className="iq-small-status">Next</span><h3>Design & initial MVP</h3><p>Define supported workloads, test model execution and build the first client. An initial release may use MineBench-operated servers.</p></article><article><span className="iq-small-status">Planned</span><h3>Provider marketplace</h3><p>Expand toward user-provided compute, contribution validation and provider rewards after the initial workflow is tested.</p></article></div>
      </FadeContent>

      <FadeContent as="section" className="iq-container iq-section" id="ecosystem">
        <div className="iq-section-heading"><div><p className="iq-overline">04 / ONE ECOSYSTEM</p><h2>Built on a shared idea.<br/>Made for different work.</h2></div><p>Measure hardware, verify useful compute, and reward contribution. MineBench and MineBench IQ explore that foundation through different applications.</p></div>
        <div className="iq-products"><article><span>AVAILABLE PRODUCT</span><h3>MineBench</h3><p>Mining, hardware benchmarking, stress testing and BMT reward workflows.</p><Link href="/downloads">Explore the client <ArrowUpRight size={16}/></Link></article><article className="iq-product-future"><span>COMING SOON</span><h3>MineBench IQ</h3><p>A planned AI compute marketplace, open-source models and the MBIQ economy.</p><Link href="/depin">Explore the DePIN direction <ArrowUpRight size={16}/></Link></article></div>
      </FadeContent>

      <FadeContent as="section" className="iq-container iq-section iq-token" id="mbiq">
        <div><p className="iq-overline">05 / MBIQ</p><h2>The token for<br/>the planned IQ economy.</h2><p>MBIQ is intended to be part of MineBench IQ’s compute economy. Utility, credits, subscriptions and settlement mechanics remain under design.</p></div>
        <div className="iq-token-address"><span>SOLANA TOKEN · MBIQ</span><h3>MineBench IQ</h3><p>Contract address</p><code>{mint}</code><a href={`https://solscan.io/token/${mint}`} target="_blank" rel="noopener noreferrer">View token on Solscan <ArrowUpRight size={16}/></a></div>
      </FadeContent>

      <section className="iq-container iq-section iq-final"><p className="iq-overline">HELP SHAPE WHAT COMES NEXT</p><h2>What would you run<br/>on MineBench IQ?</h2><p>Tell us which models and workloads matter to you. Product updates and discussions live in our community.</p><div className="iq-actions"><a className="refresh-button" href="https://discord.gg/vsDyYh4rma" target="_blank" rel="noopener noreferrer">Join the discussion <ArrowUpRight size={17}/></a><a className="refresh-link" href="https://x.com/MineBenchdapp" target="_blank" rel="noopener noreferrer">Read updates on X <ArrowUpRight size={16}/></a></div></section>
    </main><Footer/>
  </div>;
}
