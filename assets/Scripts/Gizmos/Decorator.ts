import { Component, director, Director, Node } from 'cc';

export default function registerGizmos(constructor: new () => Component) {
    const w = window as any;
    if (!w._componentsGizmos) w._componentsGizmos = [];
    if (w._componentsGizmos.includes(constructor)) return;
    w._componentsGizmos.push(constructor);
}
