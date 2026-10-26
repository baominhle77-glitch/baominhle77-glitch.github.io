"""K1 t3 — 35 explicitly authored 3D beats; shared code creates objects only.

No beat→template/_shot dispatcher. Each named method reads its locked narration
and constructs its own experiment. Scientific magnitudes are illustrative unless
explicitly identified as measured/calculated in a fixed caption.
"""
import json,math,os,hashlib
from pathlib import Path
from tqdm import tqdm
from manim import ThreeDCamera
import numpy as np
from manim import (ThreeDScene,VGroup,Surface,Sphere,Cylinder,Prism,Text,
                   ValueTracker,Rectangle,register_font,config,DEGREES,OUT,IN,UP,DOWN,
                   ORIGIN,smooth,linear)
from K1_ban_quang_hoc import MUC,NUOC,CANG,NEN_TREN,NEN_DUOI
from K1_canh.vat_the_3d import ceramic,water,table,needle,molecule,sphere,cloud,trail,PepperGrain,mesh_resolution,force_arrow

FONT_FILE=Path(__file__).resolve().parents[1]/'fonts/NotoSans-Regular.ttf'
CAPTIONS={
'h1':'A drop touches water','h2':'Clean water pulls harder','h3':'Why does flow stop?',
'h4':'A gap in pull','c1':'Every patch pulls neighbours','p1':'Surface out, water follows',
'p2':'Needle feeds the surface','p3':'Different heads and tails','p4':'Above micelle threshold',
'p5':'Pull balances water friction','p6':'Pepper rides the surface','c2':'Source, clear zone, swirls',
'v1':'Fast flow stays inside','v2':'Speed rises then falls','v3':'Abrupt slowdown at ring',
'v4':'Surface out, bottom back','v5':'Pumping changes zone size','v6':'Longer tails, larger zones',
'v7':'Same tail, different head','c3':'Molecules leave water','w1':'Beyond here, clean water',
'w2':'Calculated speed: 0.46 m/s','w3':'Calculated: 0.17 mm',
'w4':'Soap spreads more slowly','w5':'Double pumping: radius ×1.68',
'w6':'Viscosity changes the zone','w7':'The ring measures concentration',
'b1':'Measured, inherited, calculated','r1':'Measured speeds and radii',
'r2':'Calculated from the model','r3':'Estimates, not measurements',
'r4':'Kitchen mixture, single drop','s8':'From length to flow',
'k1':'Pulled by clean water','k2':'Next: tears of wine'}


class BenchCamera(ThreeDCamera):
    def get_mobjects_to_display(self,*args,**kwargs):
        # The entire bench is below the specimen. Painter sorting must not let
        # the centre of a long plank occlude a water face above that plane.
        objects=super().get_mobjects_to_display(*args,**kwargs)
        return sorted(objects,key=lambda mob: min(0,mob.z_index))


class SceneK1T3(ThreeDScene):
    def __init__(self,**kwargs):
        super().__init__(camera_class=BenchCamera,**kwargs)

    B=None
    def get_time_progression(self,run_time,description,n_iterations=None,override_skip_animations=False):
        # One continuous take, exactly N samples. No sum of rounded play/wait spans.
        if getattr(self,'_exact_take',False):
            return tqdm(np.arange(self.total_frames,dtype=float)/getattr(self,"fps",30),disable=True)
        return super().get_time_progression(run_time,description,n_iterations,override_skip_animations)

    def chay(self):
        plan=Path(os.environ.get('K1_KE_HOACH') or os.environ['K3_KE_HOACH'])
        self.plan=json.loads(plan.read_text(encoding='utf-8'));self.beat=self.plan['beats'][self.B]
        self.narration=self.beat['n'];self.source_frames=int(self.beat['so_khung']);self.fps=int(config.frame_rate)
        self.total_frames=round(self.source_frames*self.fps/30)
        self.duration=self.total_frames/self.fps;self.doc=os.environ.get('K3_BO_CUC')=='9x16'
        self.clock=ValueTracker(0);self.updates=[];self.world=VGroup();self.main=VGroup()
        self.composition=[];self._last_audit=-1;self._small_streak=0;self._longest_small=0
        self.caption_text=CAPTIONS[self.B];self.camera.background_color=MUC
        self.camera.light_source.move_to([-6,-7,10]);self.light_origin=np.array([-6.,-7.,10.])
        self.set_camera_orientation(phi=55*DEGREES,theta=-72*DEGREES,focal_distance=24)
        getattr(self,'beat_'+self.B)()
        self.pepper_clouds=[obj[0] for obj in self.main if len(obj)==2 and len(obj[0])>=400 and all(isinstance(m,PepperGrain) for m in obj[0])]
        self.add(self.world)
        self.world.set_shade_in_3d(True)
        self.fit_camera()
        self.fixed_labels()
        origin_theta=self.camera.get_theta();origin_phi=self.camera.get_phi()
        def tick(m,dt):
            t=float(self.renderer.time);self.clock.set_value(t)
            self.world.shift(-self.display_offset+self.author_center)
            for update in self.updates:update(t)
            a=smooth(min(1,t/self.duration))
            self.camera.set_theta(origin_theta+self.camera_sweep*a)
            self.camera.set_phi(origin_phi+self.camera_lift*math.sin(math.pi*a))
            self.camera.reset_rotation_matrix()
            self.world.shift(-self.author_center)
            self.frame_world()
        self.world.add_updater(tick)
        self._exact_take=True
        if os.environ.get('K1_MID_STILL')=='1':
            self.world.shift(-self.display_offset+self.author_center)
            self.clock.set_value(self.duration/2)
            for update in self.updates:update(self.duration/2)
            self.world.shift(-self.author_center)
            self.camera.set_theta(origin_theta+self.camera_sweep*.5)
            self.camera.set_phi(origin_phi+self.camera_lift)
            self.camera.reset_rotation_matrix()
            self.frame_world()
            self.world.clear_updaters()
        else:
            self.wait(self.duration,frozen_frame=False)
        self.world.clear_updaters()
        self._exact_take=False
        report={key:min(row[key] for row in self.composition) for key in ('subject_bbox_pct','subject_width_pct','subject_height_pct','stage_bbox_pct','caption_gap_px')}
        report.update(max_under_50_s=self._longest_small/self.fps,subject_clipped=any(row['clipped'] for row in self.composition),samples=len(self.composition),measurement='projected visible bounding boxes; not filled-pixel coverage')
        if self.pepper_clouds:report['projected_pepper_centres_min']=min(row['pepper_centres'] for row in self.composition)
        report['pass']=report['max_under_50_s']<=.5 and report['stage_bbox_pct']>=70 and report['caption_gap_px']>=.03*config.pixel_height
        if not self.doc:report['pass']=report['pass'] and report['subject_bbox_pct']>=70
        if self.doc:report['pass']=report['pass'] and report['subject_height_pct']>=55 and report['subject_width_pct']>=90
        if self.pepper_clouds:report['pass']=report['pass'] and report['projected_pepper_centres_min']>=300
        report['pass']=bool(report['pass'])
        if os.environ.get('K1_MID_STILL')=='1' and report['subject_bbox_pct']<50:report['pass']=False
        print('C13_COMPOSITION '+json.dumps(report),flush=True)
        print('K1_3D_TAKE',self.B,'9x16' if self.doc else '16x9',self.total_frames,
              'font='+hashlib.sha256(FONT_FILE.read_bytes()).hexdigest(),flush=True)

    def obj(self,m,main=True):
        self.world.add(m)
        if main:self.main.add(m)
        return m

    def animate_object(self,m,update,main=True):
        self.obj(m,main);self.updates.append(update);return m

    def spin(self,m,rate,axis=OUT,about_point=None):
        previous=[0.0]
        def update(t):
            angle=rate(t) if callable(rate) else rate*t
            m.rotate(angle-previous[0],axis=axis,about_point=about_point)
            previous[0]=angle
        self.updates.append(update)

    def bowl(self,r=3,sector=2*math.pi,wave_delay=0,depth=.65):
        self.surface_radius=r-.08;self.surface_impulse=wave_delay>0
        self.obj(table(14,14).shift([0,0,-(depth-.92)]),False)
        shadow=Surface(lambda u,v:np.array([.24+r*1.10*u*math.cos(v),.22+r*1.10*u*math.sin(v),-depth-.19]),u_range=(0,1),v_range=(0,2*math.pi),resolution=mesh_resolution(3,36),fill_color=MUC,fill_opacity=.25,checkerboard_colors=False,stroke_width=0)
        shadow.set_z_index(-90,family=True)
        self.obj(shadow,False)
        self.obj(ceramic(r,depth=depth,opening=sector))
        water_mob,waves=water(r-.08,depth=depth,sector=sector,impulse=wave_delay>0)
        self.animate_object(water_mob,lambda t:waves(max(0,t-wave_delay)))
        return water_mob

    def particles(self,flow='steady',n=240,r=2.75,seed=7,delay=0,extent=None):
        particles,update=cloud(n=n,radius=r,seed=seed,flow=flow,extent=extent,surface_radius=self.surface_radius,impulse=self.surface_impulse)
        return self.animate_object(particles,lambda t:update(max(0,t-delay)))

    def fly(self,phi,theta,sweep=32,lift=5,portrait_roll=90,zoom=1.4):
        if self.doc:phi=max(18,min(75,phi-10))
        phi=min(78,phi);lift=min(lift,84-phi)
        self.set_camera_orientation(phi=phi*DEGREES,theta=theta*DEGREES,gamma=(portrait_roll if self.doc else 0)*DEGREES)
        self.camera_sweep=sweep*DEGREES;self.camera_lift=lift*DEGREES;self.lens=zoom

    def read(self,*terms):
        if not all(term.lower() in self.narration.lower() for term in terms):
            raise ValueError('NARRATION_MISMATCH '+self.B+' '+repr(terms))

    def fixed_labels(self):
        fw,fh=config.frame_width,config.frame_height
        with register_font(str(FONT_FILE)):
            caption=Text(self.caption_text,font='Noto Sans',font_size=32,color=NEN_TREN)
            caption.set(height=.48)
            references=' '.join(self.beat.get('tham_so',{}).get('nguon',[]))
            source_text=('NIST · Liu · Roché' if 'NIST' in references and 'Liu' in references else 'Roché et al. · PRL 2014') if self.B!='k2' else 'Meniscus Lab'
            source=Text(source_text,font='Noto Sans',font_size=22,color=NEN_TREN)
            source.set(height=.34)
        if caption.width>fw*.94 or not 2<=len(self.caption_text.split())<=5:
            raise ValueError(f'C13_CAPTION {self.B} width={caption.width} limit={fw*.94}')
        source_y=-fh/2+fh*.03+.20
        caption_y=source_y+.16+fh*.03+.28
        caption.move_to([0,caption_y,0]);source.move_to([0,source_y,0])
        for label in (caption,source):
            if abs(label.get_left()[0])>fw*.47 or label.get_bottom()[1]<-fh*.47:
                raise ValueError('C13_LABEL_SAFE '+self.B)
        if caption.get_bottom()[1]-source.get_top()[1]<.03*fh:
            raise ValueError('C13_LABEL_GAP '+self.B)
        panel=Rectangle(width=fw,height=2.25 if self.doc else 1.65,fill_color=MUC,fill_opacity=1,stroke_width=0)
        panel.move_to([0,-fh/2+panel.height/2,0])
        self.add_fixed_in_frame_mobjects(panel,caption,source)
        print('C13_PREFLIGHT',self.B,'9x16' if self.doc else '16x9','PASS',flush=True)

    def frame_world(self):
        self.camera.reset_rotation_matrix()
        points=self.camera.project_points(self.main.get_all_points())
        lo,hi=points[:,:2].min(axis=0),points[:,:2].max(axis=0)
        screen_center=(lo+hi)/2
        self.display_offset=self.camera.get_rotation_matrix().T@np.array([-screen_center[0]/self.camera.get_zoom(),(.75-screen_center[1])/self.camera.get_zoom(),0])
        self.world.shift(self.display_offset)
        self.camera.light_source.move_to(self.light_origin-self.author_center+self.display_offset)
        self.audit_composition()

    def audit_composition(self):
        t=self.clock.get_value()
        if t<=self._last_audit or t>(self.total_frames-1)/self.fps+1e-8:return
        self._last_audit=t
        fw,fh=config.frame_width,config.frame_height
        panel=2.25 if self.doc else 1.65
        bottom=-fh/2+panel
        def visible_box(points):
            xy=self.camera.project_points(points)[:,:2]
            lo=np.maximum(xy.min(axis=0),[-fw/2,bottom]);hi=np.minimum(xy.max(axis=0),[fw/2,fh/2])
            dims=np.maximum(0,hi-lo)
            return lo,hi,dims,xy
        lo,hi,dims,xy=visible_box(self.main.get_all_points())
        _,_,stage,_=visible_box(self.world.get_all_points())
        area=100*dims[0]*dims[1]/(fw*fh)
        self._small_streak=self._small_streak+1 if area<50 else 0
        self._longest_small=max(self._longest_small,self._small_streak)
        caption_top=-fh/2+fh*.06+.88
        row=dict(subject_bbox_pct=area,subject_width_pct=100*dims[0]/fw,subject_height_pct=100*dims[1]/fh,stage_bbox_pct=100*stage[0]*stage[1]/(fw*fh),caption_gap_px=(lo[1]-caption_top)*config.pixel_height/fh,clipped=bool((xy[:,0]<-fw/2).any() or (xy[:,0]>fw/2).any() or (xy[:,1]<bottom).any() or (xy[:,1]>fh/2).any()))
        if self.pepper_clouds:
            centres=np.array([m.get_center() for cloud in self.pepper_clouds for m in cloud])
            centres=self.camera.project_points(centres)
            row['pepper_centres']=int(np.count_nonzero((np.abs(centres[:,0])<=fw/2)&(centres[:,1]>=bottom)&(centres[:,1]<=fh/2)))
        self.composition.append(row)

    def fit_camera(self):
        # Constant lens for the whole take, solved from actual 3D poses. This
        # prevents a thin/rotating object from shrinking halfway through a beat.
        self.author_center=self.main.get_center().copy()
        theta,phi=self.camera.get_theta(),self.camera.get_phi()
        fw,fh=config.frame_width,config.frame_height
        panel=2.25 if self.doc else 1.65
        def fits(span,zoom):
            width=min(fw,span[0]*zoom)
            lo=max(-fh/2+panel,.75-span[1]*zoom/2)
            hi=min(fh/2,.75+span[1]*zoom/2)
            height=max(0,hi-lo)
            if self.doc:return width/fw>=.94 and height/fh>=.60 and width*height/(fw*fh)>=.55
            return width*height/(fw*fh)>=.725
        needed=[]
        for fraction in np.linspace(0,1,9):
            t=fraction*(self.total_frames-1)/self.fps
            for update in self.updates:update(t)
            ease=smooth(fraction)
            self.camera.set_theta(theta+self.camera_sweep*ease)
            self.camera.set_phi(phi+self.camera_lift*math.sin(math.pi*ease))
            self.camera.reset_rotation_matrix()
            self.world.shift(-self.author_center)
            span=np.ptp(self.camera.project_points(self.main.get_all_points())[:,:2],axis=0)
            self.world.shift(self.author_center)
            low,high=.01,8.
            for _ in range(24):
                mid=(low+high)/2
                if fits(span,mid):high=mid
                else:low=mid
            needed.append(high)
        for update in self.updates:update(0)
        self.camera.set_theta(theta);self.camera.set_phi(phi)
        self.camera.set_zoom(max(needed)*1.045)
        self.clock.set_value(0)
        self.world.shift(-self.author_center)
        self.frame_world()

    def beat_h1(self):
        self.read('drop','pepper')
        self.fly(58,-90,24,7,zoom=1.55);self.bowl(wave_delay=.5);self.particles('outward',n=600,seed=11,delay=.5)
        drop=self.obj(sphere(.24,CANG,(0,0,.8)))
        self.updates.append(lambda t:drop.move_to([0,0,max(.08,.8-3.2*min(t,.5)**2)]).set_opacity(min(1,max(0,1-(t-.55)*3))))

    def beat_h2(self):
        self.read('Clean water','pulls harder')
        self.fly(54,-36,42,9,zoom=1.7);self.bowl(3.1);self.particles('outward',n=600,r=2.9,seed=23)
        for i in range(6):
            a=i*math.pi/3
            anchor=np.array([.6*math.cos(a),.6*math.sin(a),-.03])
            m=self.obj(molecule(anchor,tail=6))
            self.spin(m,lambda t:.12*math.sin(.5*t),axis=np.array([0,1,0]),about_point=anchor)


    def beat_h3(self):
        self.read('steadily','ring')
        self.fly(57,-122,26,8,zoom=1.6);self.bowl(2.8);self.obj(needle());self.particles('confined',r=2.55,seed=31)
        ring=self.obj(Surface(lambda u,v:np.array([(1.9+.05*math.cos(v))*math.cos(u),(1.9+.05*math.cos(v))*math.sin(u),.09+.05*math.sin(v)]),u_range=(0,2*math.pi),v_range=(0,2*math.pi),resolution=mesh_resolution(36,4),fill_color=CANG,checkerboard_colors=False,stroke_width=0))

    def beat_h4(self):
        self.read('twenty five','gap')
        self.fly(68,-45,38,6);self.bowl(3,sector=math.pi*1.65);self.particles('steady',seed=43)
        for x,tail in [(-1.5,3),(-.5,4),(.5,5),(1.5,6)]:
            anchor=np.array([x,0,-.02])
            m=self.obj(molecule(anchor,tail=tail));m.scale(1.4,about_point=anchor)
            self.updates.append(lambda t,m=m,x=x:m.shift(np.array([x+.2*math.sin(t*.7),.25*math.sin(t),-.02])-m[0].get_center()))

    def beat_c1(self):
        self.read('neighbours','surface')
        self.fly(70,-100,34,10);self.bowl(2.9,sector=math.pi*1.4)
        for i in range(18):
            x=-2.4+(i%6)*.85;y=-1+(i//6)*.8;m=self.obj(molecule((x,y,-.04),tail=4))
            self.updates.append(lambda t,m=m,x=x,y=y:m.shift(np.array([x+.22*math.sin(.6*t+y),y,-.04+.02*math.sin(t+x)])-m[0].get_center()))
        for y in [-0.9, 0.2]:
            for x in (-2,-.8,.8,2):
                direction=-1 if x<0 else 1
                length=.85 if abs(x)>1 else .35
                start=np.array([x,y,.42])
                arrow=self.obj(force_arrow(start,start+np.array([direction*length,0,0])))


    def beat_p1(self):
        self.read('water just below','outward')
        self.fly(76,-74,28,8);self.bowl(3.2,sector=math.pi*1.5,depth=1.65);self.particles('return',r=2.9,seed=61)
        for z in (-.2,-.5):
            beads=self.obj(VGroup(*[sphere(.09,CANG,(i*.35-2.5,0,z),detail=(3,4)) for i in range(15)]))
            self.updates.append(lambda t,g=beads,z=z:g.move_to([.45*math.sin(t),0,z]))
        for y in [-0.7, 0.7]:
            for x in (-2,-.8,.8,2):
                direction=-1 if x<0 else 1
                length=.85 if abs(x)>1 else .35
                start=np.array([x,y,.42])
                arrow=self.obj(force_arrow(start,start+np.array([direction*length,0,0])))


    def beat_p2(self):
        self.read('fine needle','olive oil')
        self.fly(51,-20,33,6,zoom=1.75);self.bowl(3.3);self.obj(needle((.4,.5,1.4),2.5));self.particles('steady',r=3,seed=72)
        pump=self.obj(Cylinder(radius=.35,height=1.2,resolution=mesh_resolution(12,2),fill_color=CANG,checkerboard_colors=False,stroke_width=0).move_to([.4,.5,3]))
        self.updates.append(lambda t:pump.move_to([.4,.5,3-.25*(1-math.exp(-t/8))]))

    def beat_p3(self):
        self.read('eight surfactants','tails and heads')
        self.fly(53 if self.doc else 61,-115,30,9,portrait_roll=0);self.bowl(4.4 if self.doc else 4,sector=math.pi*1.6,depth=1.5)
        for i in range(8):
            x=(i%2-.5)*2.6 if self.doc else (i%4-1.5)*1.8
            y=(i//2-1.5)*2.6 if self.doc else (i//4-.5)*2.6
            anchor=np.array([x,y,.02])
            m=self.obj(molecule(anchor,tail=3+i,head_radius=.17+.025*(i%3)))
            m.scale(1.4,about_point=anchor)
            self.spin(m,lambda t:.15*math.sin(.6*t),axis=np.array([0,1,0]),about_point=anchor)

    def beat_p4(self):
        self.read('micelles','threshold')
        self.fly(63,-90,32,7,portrait_roll=0);self.obj(table(),False)
        self.obj(sphere(2.3,NUOC,(0,0,0),detail=(12,20)).set_fill(opacity=.22))
        for i in range(28):
            a=i*2.39996;z=1-2*(i+.5)/28;r=math.sqrt(1-z*z)
            pos=np.array([r*math.cos(a),r*math.sin(a),z])*1.7
            m=self.obj(molecule(pos,tail=4));m.rotate(math.acos(-z),axis=np.array([math.sin(a),-math.cos(a),0]),about_point=pos)
            self.spin(m,.15,about_point=ORIGIN)

        for k in range(12):
            x=((k%2)*2-1)*3.15 if not self.doc else ((k%2)*2-1)*2.5
            y=(k//2-2.5)*.68
            self.obj(molecule((x,y,.25),tail=4))

    def beat_p5(self):
        self.read('friction','thin moving layer')
        self.fly(58,-92,30,10);self.bowl(3.1,sector=math.pi*1.3,depth=2.2)
        for k in range(4):
            sheet=self.obj(Prism(dimensions=(4.6,2.5,.20),fill_color=NUOC if k%2 else CANG,stroke_width=0).move_to([0,0,-.30*k]))
            self.updates.append(lambda t,m=sheet,k=k:m.move_to([.35*math.sin(t*.45)*(1-k/5),0,-.30*k]))

    def beat_p6(self):
        self.read('Pepper grains float','bowl')
        self.fly(75,-42,25,7);self.bowl(3.4,sector=math.pi*1.65,depth=.9);self.particles('outward',n=480,r=3.15,seed=96)
        grain=self.obj(sphere(.45,MUC,(1,0,.32),detail=(6,10)))
        self.updates.append(lambda t:grain.move_to([1+1.6*(1-math.exp(-t/4)),.2*math.sin(t),.22]))

    def beat_c2(self):
        self.read('three zones','swirls')
        self.fly(34,-146,48,10,zoom=1.85);self.bowl(3.3,sector=math.pi*1.65);self.obj(needle((-.3,.2,1.2)));self.particles('vortices',r=3,seed=102)
        inner,upd=cloud(n=120,radius=1.3,seed=103,color=CANG,flow='steady');self.animate_object(inner,upd)

    def beat_v1(self):
        self.read('barely moves','confined')
        self.fly(79,-175,19,8);self.bowl(3.5,sector=math.pi*1.25);self.particles('confined',r=3.2,seed=111)
        self.obj(needle((-1.6,-.6,1.1)))

    def beat_v2(self):
        self.read('one centimetre','half a metre')
        self.fly(72,-158,35,9);self.bowl(3.1,sector=math.pi*1.75);self.particles('profile',r=2.8,seed=122)
        tracer=self.obj(sphere(.19,CANG,detail=(6,8)))
        self.updates.append(lambda t:tracer.move_to([2.5*math.sin(.4*t),.6*math.cos(.4*t),.16]))

    def beat_v3(self):
        self.read('decelerate abruptly','ring')
        self.fly(62,-60,39,8);self.bowl(3,sector=math.pi*1.7);self.particles('confined',r=2.8,seed=131)
        self.obj(needle((1.3,.7,1.2)))
        marker=self.obj(molecule((-1.4,-.7,.1),tail=7));marker.scale(2)

    def beat_v4(self):
        self.read('bottom','one loop')
        self.fly(55,-20,46,8);self.bowl(3.3,sector=math.pi*.82,depth=1.8)
        for i in range(30):
            m=self.obj(sphere(.11,CANG,detail=(3,5)))
            self.updates.append(lambda t,m=m,i=i:m.move_to([2.8*math.cos(t*.65+i*.21),.55*math.sin(i),-.9+.8*math.sin(t*.65+i*.21)]))

    def beat_v5(self):
        self.read('injection flow rate','size')
        self.fly(45,-82,43,6);self.bowl(3.7);self.obj(needle((0,0,1.4)));self.particles('growing',r=3.4,seed=151,extent=lambda t:.60+.30*smooth(t/self.duration))
        piston=self.obj(Prism(dimensions=(.4,.4,1),fill_color=CANG,stroke_width=0).move_to([0,0,2.8]))
        self.updates.append(lambda t:piston.move_to([0,0,2.8-.3*(t/self.duration)]))

    def beat_v6(self):
        self.read('Double','carbon atoms')
        self.fly(66,-110,22,9,portrait_roll=0);self.bowl(3.5,sector=math.pi*1.5,depth=1.5)
        for x,tail in [(-1.9,8),(1.9,16)]:
            anchor=np.array([x,0,.02])
            m=self.obj(molecule(anchor,tail=tail));m.scale(1.4,about_point=anchor)
            self.spin(m,lambda t:.18*math.sin(.5*t),axis=np.array([0,1,0]),about_point=anchor)

    def beat_v7(self):
        self.read('twelve carbon','swap only the head')
        self.fly(54,-150,20,9,portrait_roll=0);self.bowl(3.2,sector=math.pi*1.6,depth=1.4)
        for x,head in [(-1.7,.17),(1.7,.32)]:
            anchor=np.array([x,0,.02])
            m=self.obj(molecule(anchor,tail=12,head_radius=head));m.scale(1.4,about_point=anchor)
            # Schematic sulfate polar lobes versus three methyl substituents;
            # both molecules retain exactly the same twelve-carbon tail.
            m[0].scale(.7 if x<0 else .45,about_point=anchor)
            offsets=[(1,1,1),(-1,-1,1),(-1,1,-1),(1,-1,-1)] if x<0 else [(1,0,-.35),(-.5,.866,-.35),(-.5,-.866,-.35)]
            for delta in offsets:
                delta=np.array(delta,dtype=float);delta=delta/np.linalg.norm(delta)
                m.add(sphere(.14 if x<0 else .168,CANG if x<0 else MUC,anchor+delta*(.224 if x<0 else .336),detail=(3,4)))
            self.spin(m,lambda t:.2*math.sin(.6*t),axis=np.array([0,1,0]),about_point=anchor)

    def beat_c3(self):
        self.read('dissolve','molecules')
        self.fly(78,-145,42,11);self.bowl(3.3,sector=math.pi*1.4)
        for i in range(24):
            m=self.obj(molecule((0,0,.2),tail=5));a=i*2.4
            self.updates.append(lambda t,m=m,a=a,i=i:m.move_to([2.5*math.sin(t*.13+a),1.5*math.cos(a),-.4+.6*math.sin(t*.22+i)]))

    def beat_w1(self):
        self.read('desorbed','clean again')
        self.fly(38,-55,47,6,zoom=1.55);self.bowl(3.5);self.particles('confined',r=3.2,seed=201)
        for i in range(12):
            m=self.obj(molecule((0,0,.2),tail=4));a=i*math.pi/6
            self.updates.append(lambda t,m=m,a=a:m.move_to([2*math.cos(a),2*math.sin(a),-.5+.6*math.cos(t*.25+a)]))

    def beat_w2(self):
        self.read('speed law','zero point four six')
        self.fly(66,-104,41,11);self.bowl(3,sector=math.pi*1.5);self.particles('steady',r=2.7,seed=212)
        self.obj(needle((-.7,0,1.4)))
        for k in range(5):self.obj(molecule((k*.75-1.5,-1.3,.3),tail=6))

    def beat_w3(self):
        self.read('thickness','zero point one seven')
        self.fly(60,-69,31,12);self.bowl(3.7,sector=math.pi*1.1,depth=2.4)
        slab=self.obj(Prism(dimensions=(5.4,2.5,.17),fill_color=CANG,stroke_width=0).move_to([0,0,-.15]))
        self.updates.append(lambda t:slab.move_to([.45*math.sin(.5*t),0,-.15]))
        self.particles('return',r=3.3,seed=223)

    def beat_w4(self):
        self.read('Schmidt','hundred times thinner')
        self.fly(77,-125,38,10,portrait_roll=0);self.obj(table(),False)
        for k in range(8):
            slab=self.obj(Prism(dimensions=(5,2.7,.11),fill_color=NUOC,stroke_width=0).move_to([0,0,k*.20]))
            self.updates.append(lambda t,m=slab,k=k:m.move_to([.4*math.sin(.6*t+k*.05),0,k*.2]))
        for i in range(12):self.obj(molecule((i*.4-2.2,0,1.7),tail=3))

    def beat_w5(self):
        self.read('three quarters','one point six eight')
        self.fly(30,-120,40,9);self.bowl(3.8);self.particles('growing',r=3.5,seed=245,extent=lambda t:.55*(1+.68*smooth(t/self.duration)))
        self.obj(needle((.5,0,1.4)))

    def beat_w6(self):
        self.read('viscous','meniscus')
        self.fly(48,-10,31,9);self.bowl(2.8,sector=math.pi*1.85);self.obj(needle((.5,.1,.9),1.6))
        meniscus=self.obj(Surface(lambda r,a:np.array([.5+r*math.cos(a),.1+r*math.sin(a),.4*math.exp(-3*r)]),u_range=(.1,1.5),v_range=(0,2*math.pi),resolution=mesh_resolution(12,24),fill_color=NUOC,checkerboard_colors=False,stroke_width=0))
        self.particles('return',r=2.5,seed=256)

    def beat_w7(self):
        self.read('single measurement','ring')
        self.fly(22,-66,36,12,zoom=1.9);self.bowl(3.2,sector=math.pi*1.85);self.obj(needle((0,0,1.3)));self.particles('confined',r=2.9,seed=267)
        caliper=self.obj(Prism(dimensions=(5.8,.15,.15),fill_color=NEN_TREN,stroke_width=0).move_to([0,-2.6,.4]))

    def beat_b1(self):
        self.read('Three kinds','bench')
        self.fly(50,-100,40,9);self.obj(table().shift([0,0,.27]),False)
        self.obj(needle((-2,0,1),2));self.obj(molecule((0,0,1),tail=8).scale(2))
        self.obj(ceramic(1.4).shift([2,0,0]))
        water_mob,waves=water(1.3)
        water_mob.shift([2,0,0])
        def update_water(t):
            waves(t);water_mob[1].shift([2,0,0])
        self.animate_object(water_mob,update_water)
        particles,advect=cloud(n=80,radius=1.1,seed=281,flow='vortices',surface_radius=1.3)
        particles.shift([2,0,0])
        def update_tracers(t):
            advect(t)
            particles[1].shift([2,0,0])
        self.animate_object(particles,update_tracers)

    def beat_r1(self):
        self.read('Measured','temperature')
        self.fly(42,-35,27,7);self.bowl(3.6,sector=math.pi*1.45);self.particles('steady',r=3.3,seed=291);self.obj(needle((-1,.5,1.5)))

    def beat_r2(self):
        self.read('Calculated','hundred times thinner')
        self.fly(80,-88,34,8);self.bowl(3.4,sector=math.pi*1.3);self.particles('return',r=3,seed=302)
        for i in range(4):self.obj(molecule((i*1.1-1.7,-.5,.3),tail=5+i))

    def beat_r3(self):
        self.read('assumptions','not our measurement')
        self.fly(64,-18,30,10);self.bowl(2.7,sector=math.pi*1.6);self.obj(needle((.9,.2,1.2)));self.particles('confined',r=2.4,seed=313)
        self.obj(Prism(dimensions=(4.8,.2,.2),fill_color=NEN_TREN,stroke_width=0).move_to([0,-2.2,.3]))

    def beat_r4(self):
        self.read('not','mixture')
        self.fly(39,-113,48,9);self.bowl(3.5);self.particles('outward',r=3.2,seed=324)
        bottle=self.obj(Cylinder(radius=.65,height=2.1,resolution=mesh_resolution(16,2),fill_color=NUOC,checkerboard_colors=False,stroke_width=0).move_to([-3.2,-2,1.1]))
        cap=self.obj(Cylinder(radius=.35,height=.5,resolution=mesh_resolution(12,2),fill_color=MUC,checkerboard_colors=False,stroke_width=0).move_to([-3.2,-2,2.4]))

    def beat_s8(self):
        self.read('three episodes','capillary length')
        self.fly(71,-138,46,10);self.bowl(3.3,sector=math.pi*1.4);self.particles('return',r=3,seed=338)
        self.obj(needle((1.7,.4,1.2)));self.obj(molecule((-1.7,.2,.4),tail=7).scale(2))

    def beat_k1(self):
        self.read('not pushed','Try it')
        self.fly(65,-40,36,12);self.camera.set_focal_distance(60);self.bowl(3.7,depth=.95);self.particles('outward',n=600,r=3.4,seed=349)
        drop=self.obj(sphere(.28,CANG,(0,0,.3)))
        self.updates.append(lambda t:drop.move_to([0,0,.2+.08*math.sin(t)]))

    def beat_k2(self):
        self.read('wine','tears')
        self.fly(69,-103,42,9,portrait_roll=0,zoom=1.9);self.obj(table(),False)
        glass=self.obj(Surface(lambda z,a:np.array([(.35+1.9*math.sin(math.pi*z/4.2))*math.cos(a),(.35+1.9*math.sin(math.pi*z/4.2))*math.sin(a),z]),u_range=(0,3),v_range=(0,2*math.pi),resolution=mesh_resolution(20,40),fill_color=NUOC,fill_opacity=.60,checkerboard_colors=False,stroke_width=0))
        self.obj(Cylinder(radius=.12,height=1.1,resolution=mesh_resolution(12,2),fill_color=NEN_TREN,checkerboard_colors=False,stroke_width=0).move_to([0,0,-.55]))
        self.obj(Cylinder(radius=1.1,height=.12,resolution=mesh_resolution(24,2),fill_color=NEN_TREN,checkerboard_colors=False,stroke_width=0).move_to([0,0,-1.13]))
        for i in range(18):
            a=i*2*math.pi/18;drop=self.obj(sphere(.11,CANG,detail=(4,6)))
            def tear(t,m=drop,a=a,i=i):
                phase=(t*.2+i/18)%1
                z=.7+1.7*smooth(phase/.65) if phase<.65 else 2.4-1.7*smooth((phase-.65)/.35)
                radius=.35+1.9*math.sin(math.pi*z/4.2)
                m.move_to([radius*math.cos(a),radius*math.sin(a),z])
            self.updates.append(tear)
