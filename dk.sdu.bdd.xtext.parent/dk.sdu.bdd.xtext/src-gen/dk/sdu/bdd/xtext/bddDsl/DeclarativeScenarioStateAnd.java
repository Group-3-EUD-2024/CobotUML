/**
 * generated by Xtext 2.36.0
 */
package dk.sdu.bdd.xtext.bddDsl;

import org.eclipse.emf.common.util.EList;

import org.eclipse.emf.ecore.EObject;

/**
 * <!-- begin-user-doc -->
 * A representation of the model object '<em><b>Declarative Scenario State And</b></em>'.
 * <!-- end-user-doc -->
 *
 * <p>
 * The following features are supported:
 * </p>
 * <ul>
 *   <li>{@link dk.sdu.bdd.xtext.bddDsl.DeclarativeScenarioStateAnd#getStates <em>States</em>}</li>
 * </ul>
 *
 * @see dk.sdu.bdd.xtext.bddDsl.BddDslPackage#getDeclarativeScenarioStateAnd()
 * @model
 * @generated
 */
public interface DeclarativeScenarioStateAnd extends EObject
{
  /**
   * Returns the value of the '<em><b>States</b></em>' containment reference list.
   * The list contents are of type {@link org.eclipse.emf.ecore.EObject}.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @return the value of the '<em>States</em>' containment reference list.
   * @see dk.sdu.bdd.xtext.bddDsl.BddDslPackage#getDeclarativeScenarioStateAnd_States()
   * @model containment="true"
   * @generated
   */
  EList<EObject> getStates();

} // DeclarativeScenarioStateAnd
