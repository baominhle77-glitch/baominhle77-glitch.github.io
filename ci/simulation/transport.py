"""Radial surface transport plus a closed subsurface return circulation.

Qualitative Marangoni thin-layer model: r dr/dt = forcing(t). The source
impulse decays rapidly; continuous feeding supplies a slower sustained term.
This is an explanatory model, not a fitted reproduction of a PRL experiment.
"""
import numpy as np

def impulse_integral(t,burst=.145,slow=.12):
 t=np.maximum(0.,np.asarray(t));return burst*(-np.expm1(-t/.12))+slow*(-np.expm1(-t/3.0))

def surface_radius(initial,t,steady=False):
 t=np.maximum(0.,np.asarray(t));mass=impulse_integral(t)
 if steady:mass+=.045*t
 return np.minimum(.975,np.sqrt(initial*initial+2*mass))

def radial_velocity(r,t,steady=False):
 t=np.maximum(0.,np.asarray(t));forcing=.145/.12*np.exp(-t/.12)+.12/3*np.exp(-t/3)
 if steady:forcing+=.045
 return forcing/np.maximum(.08,np.asarray(r))

def circulation(phase,t):
 """Top flow outward, descent at wall, return below, rise at source."""
 a=2*np.pi*(np.asarray(phase)+.15*t)
 return .91*np.sin(a),-.48+.40*np.cos(a)
