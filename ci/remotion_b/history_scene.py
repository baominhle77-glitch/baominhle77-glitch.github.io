"""D18 fictional-history proof: text-free map, armies, routes and changing states."""
import os,math
import numpy as np
from manim import *
DOC=os.environ.get('B_FORMAT')=='9x16';config.pixel_width=540 if DOC else 960;config.pixel_height=960 if DOC else 540;config.frame_width=8 if DOC else 128/9;config.frame_height=128/9 if DOC else 8;config.frame_rate=30;config.background_color='#8E969D'
class HistoryProof(MovingCameraScene):
 def construct(self):
  W,H=(7.0,9.5) if DOC else (12.5,5.7);center=np.array([0,-.8 if DOC else -.2,0]);rng=np.random.default_rng(1847)
  terrain=VGroup()
  for i in range(9):
   a=TAU*i/9;p=center+np.array([W*.22*math.cos(a),H*.20*math.sin(a),0]);poly=Polygon(*[p+np.array([W*.21*math.cos(a+TAU*j/7),H*.25*math.sin(a+TAU*j/7),0]) for j in range(7)],fill_color=['#3F6A9E','#527D75','#6E8170'][i%3],fill_opacity=1,stroke_color='#1C232B',stroke_width=2);terrain.add(poly)
  base=RoundedRectangle(width=W,height=H,corner_radius=.25,fill_color='#A7ADB3',fill_opacity=1,stroke_color='#1C232B',stroke_width=2).move_to(center);self.add(base,terrain)
  ownership=Rectangle(width=W*.10,height=H*.88,fill_color='#3F6A9E',fill_opacity=.40,stroke_width=0).move_to(center+[-W*.4,0,0]);self.add(ownership)
  towns=VGroup(*[Circle(radius=.11,fill_color='#D1834F',fill_opacity=1,stroke_color='#1C232B',stroke_width=2).move_to(center+[W*x,H*y,0]) for x,y in ((-.3,-.3),(.27,.26),(-.28,.3),(.30,-.22))]);self.add(towns)
  n=140;phase=rng.random(n);lanes=rng.uniform(-.39,.39,n);units=VGroup(*[Triangle(fill_color='#3F6A9E' if i%2 else '#D1834F',fill_opacity=1,stroke_color='#1C232B',stroke_width=1.5).scale(.14) for i in range(n)]);self.add(units)
  route=VMobject(stroke_color='#D1834F',stroke_width=14).set_points_as_corners([center+[-W*.3,-H*.3,0],center+[-W*.29,-H*.29,0]]);self.add(route)
  frontier=VMobject(stroke_color='#1C232B',stroke_width=9);self.add(frontier)
  def update(m,dt):
   t=self.renderer.time
   captured=W*(.10+.80*min(1,t/20));ownership.stretch_to_fit_width(captured).move_to(center+[-W*.45+captured/2,0,0])
   for i,u in enumerate(units):
    x=((phase[i]+t*(.09+.015*(i%3)))%1-.5)*W*.86;y=lanes[i]*H+.13*math.sin(t+i);u.move_to(center+[x,y,0])
   extent=.08+.84*smooth((t%4)/4);route.set_points_smoothly([center+[W*(-.3+extent*q),H*(-.3+.5*extent*q),0] for q in np.linspace(0,1,30)])
   frontier.set_points_smoothly([center+[W*(-.40+.80*min(1,t/20)+.035*math.sin(y*8+t*.5)),H*y,0] for y in np.linspace(-.46,.46,60)])
   key=int(t/3.6);u=smooth((t-key*3.6)/3.6);pan=(.30 if DOC else .55)*(math.sin(key*1.1)*(1-u)+math.sin((key+1)*1.1)*u);self.camera.frame.set(width=config.frame_width*(1.06+.025*math.cos(t*.8))).move_to([pan,.03*math.sin(t*.6),0])
  world=VGroup(*self.mobjects);self.clear();self.add(world);world.add_updater(update);self.wait(20,frozen_frame=False)
